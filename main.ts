import { Select, Input, List } from 'https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts'
import * as uuid from "https://deno.land/std@0.192.0/uuid/mod.ts";  
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";
import { Number } from 'https://deno.land/x/cliffy@v0.25.7/prompt/number.ts';
import { Confirm } from 'https://deno.land/x/cliffy@v0.25.7/prompt/confirm.ts';
import { AbstractDBDriver, ConnectionConfig } from './drivers/DBDriver.ts';
import { MongoDriver, MongoConnectionConfig, validateMongoConnectionURI } from './drivers/MongoDriver.ts'
import { Question, QuestionType, validateQuestionAnswer } from "./types.ts";
import { parseFlags } from "https://deno.land/x/cliffy@v1.0.0-rc.1/flags/mod.ts";
import { shouldSavePrompt } from "./util.ts";

const cmdFlags = parseFlags(Deno.args)
const formatErrorString = (error: string) => colors.red("ERROR: " + error)
const unimplementedError = () => console.log(formatErrorString("This option is currently not implemented."))

interface IQuestionEditorPromptOptions {
    EditType: string
    EditQuestionString: string
    EditQuestionAnswer: string
    SetTags: string
    SetChoices: string
    PrintQuestion: string
    Finish: string
}

const generateQuestionID = (): string => {
    const id: string = uuid.v1.generate() as string
    // if (db?.questionExists(id)) { // TODO: consider removing in the future, might speed up might not
    //     id = generateQuestionID()
    // }

    return id
}
const isQuestionSingleChoice = (question: Question) => { return question.type == QuestionType.NUMERIC || question.type == QuestionType.STRING }
function MK_BLANK_QUESTION(): Question {
    return {
        id: generateQuestionID(),
        type: QuestionType.STRING,
        choices: []
    } as Question
}
function printQuestion(question: Question) {
    const spacing = '        '
    let choicesString = question.type == QuestionType.MULTIPLE_CHOICE ? `\n${spacing}Choices: ` : ""
    for (const choice of question.choices) {
        choicesString += `\n\t\t- ${choice}`
    }

    const answerString = isQuestionSingleChoice(question) && question.answer != undefined ? `\n${spacing}` + question.answer : ''

    console.log(`
        UUID: ${question.id}
        Type: ${question.type}
        Question String: ${question.questionString}
        Tags: ${question.tags}${choicesString}${answerString}
    `)
}

// deno-lint-ignore no-inferrable-types no-unused-vars
async function questionEditor(question: Question, write: boolean = true): Promise<Question> {
    /**
     * @param {Question} question - The question you wish to edit
     * @param {boolean} [write=true] - Should the edited question be written to the DB
     */

    editorLoop: while (true) {
        const QuestionEditorPromptOptions: IQuestionEditorPromptOptions = {
            EditType: `Type: ${question.type}`,
            EditQuestionString: `Question: ${question.questionString}`,
            EditQuestionAnswer: `Answer: ${question.answer}`,
            SetTags: `Tags: ${question.tags}`,
            SetChoices: `Set the choices for this question`,
            PrintQuestion: `Print the question to the console`,
            Finish: `Finish`,
        } as IQuestionEditorPromptOptions

        const chosenOption = await Select.prompt({
            message: "What would you like to do?",
            options: [
                QuestionEditorPromptOptions.EditQuestionString,
                ...(question.type == QuestionType.MULTIPLE_CHOICE ? [QuestionEditorPromptOptions.SetChoices] : []),
                ...(isQuestionSingleChoice(question) ? [QuestionEditorPromptOptions.EditQuestionAnswer] : []),
                QuestionEditorPromptOptions.EditType,
                QuestionEditorPromptOptions.PrintQuestion,
                QuestionEditorPromptOptions.Finish
            ]
        })

        if (chosenOption == QuestionEditorPromptOptions.Finish) {
            break editorLoop // End the editor
        }

        if (chosenOption == QuestionEditorPromptOptions.EditType) {
            const newType: QuestionType = await Select.prompt({
                message: "Select the new question type",
                options: Object.values(QuestionType)
            }) as QuestionType

            const confirmed = await Confirm.prompt(colors.red("Changing the type of the question will result in you losing any answers set for it.") + " Continue?")
            if (!confirmed) {
                console.log("Cancelled")
                continue editorLoop
            }
    
            question.type = newType
            switch (newType) {
                case QuestionType.MULTIPLE_CHOICE:
                    question.choices = []
                    question.answer = undefined
                    question.correctChoice = NaN
                    break
                case QuestionType.NUMERIC:
                    question.choices = []
                    question.answer = NaN
                    question.correctChoice = undefined
                    break
                case QuestionType.STRING:
                    question.choices = []
                    question.answer = ""
                    question.correctChoice = undefined
                    break
                default:
                    unimplementedError()
            }
        } else if (chosenOption == QuestionEditorPromptOptions.EditQuestionString) {
            const newQuestionString: string = await Input.prompt("Enter the new question string: ")
            question.questionString = newQuestionString
        } else if (chosenOption == QuestionEditorPromptOptions.EditQuestionAnswer) {
            const newQuestionAnswerRaw: string = await Input.prompt("Enter the new question answer: ")
            if (!validateQuestionAnswer(question, newQuestionAnswerRaw)) {
                console.log(formatErrorString("That is an invalid answer."))
            }

            // Format the answer string into the correct type
            if (question.type == QuestionType.NUMERIC) {
                question.answer = +newQuestionAnswerRaw
            } else if (question.type == QuestionType.STRING) {
                question.answer = newQuestionAnswerRaw
            } else if (question.type == QuestionType.MULTIPLE_CHOICE) {
                // TODO: Handle multiple choice question
            }
        } else if (chosenOption == QuestionEditorPromptOptions.SetTags) {
            const newTags: string[] = await List.prompt("Enter the new list of tags: ")
            question.tags = newTags
        } else if (chosenOption == QuestionEditorPromptOptions.SetChoices) {
            if (question.type != QuestionType.MULTIPLE_CHOICE) {
                console.error(colors.red(`Unable to set choices: Question type is not set to ${QuestionType.MULTIPLE_CHOICE}`))
                continue editorLoop
            }

            const options = {
                Edit: "Edit one or more of the existing choices, or change the answer",
                SetNew: "Set entirely new choices"
            }
            const visibleOptions = [
                ...(question.choices.length > 0 ? [options.Edit] : []),
                options.SetNew
            ]

            const chosenOption2 = visibleOptions.length == 1 ? visibleOptions[0] : await Select.prompt({
                message: "What would you like to do?",
                options: visibleOptions
            })
            
            if (chosenOption2 == options.SetNew) {
                const choiceCount = await Number.prompt("How many answers are there?")
                console.log(colors.cyan('Type \'exit\' at any time to go back to the editing menu.'))
                for (let _ = 0; _ < choiceCount; _++) {
                    const answerString = await Input.prompt(`Enter answer #${_ + 1}`)
                    if (answerString == 'exit') {
                        continue editorLoop
                    }
                    question.choices?.push(answerString)
                }
    
                const correctChoice = (await Number.prompt("Which choice is correct?")) - 1
                question.correctChoice = correctChoice
            } else {
                unimplementedError()
            }
        } else if (chosenOption == QuestionEditorPromptOptions.PrintQuestion) {
            printQuestion(question)
        } else {
            unimplementedError()
        }

    }

    return Promise.resolve(question)
}

async function questionCreator() {
    const question: Question = await questionEditor(MK_BLANK_QUESTION())

    return question
}

enum RootPromptOption {
    CreateQuiz = "Create a quiz",
    CreateQuestion = "Create a question",
    Connect = "Connect to a data source",
    Disconnect = "Disconnect from the data source",
    Test = "Test",
    Exit = "Exit"
}

enum DataSource {
    MongoDB = "MongoDB",
    // MySQL = "MySQL"
}


let db: AbstractDBDriver<ConnectionConfig> | undefined = undefined;
const isConnected = () => { return db != undefined && db != null && db.connected }

if (cmdFlags.flags.dev) {
    db = new MongoDriver({ connectionURI: 'mongodb://localhost:27017' } as MongoConnectionConfig)
    await db.connect()
}

rootOptionLoop: while (true) {
    const chosenRootOption = await Select.prompt({
        message: "What would you like to do?",
        options: [
            ...(cmdFlags.flags.dev ? [RootPromptOption.Test] : []),
            ...(isConnected() ? [RootPromptOption.CreateQuiz, // Only show these while isConnected
                             RootPromptOption.CreateQuestion,
                             RootPromptOption.Disconnect] : []),
            ...(!isConnected() ? [RootPromptOption.Connect, // Only show these while disconnected
                             RootPromptOption.Exit] : [])
        ]
    })

    if (chosenRootOption == RootPromptOption.Test) {
        if (db == null || db == undefined) {
            continue rootOptionLoop
        }

        const questions: Question[] = await db?.getAllQuestions()
        console.log(questions)
    } else if (chosenRootOption == RootPromptOption.CreateQuestion) {
        const question: Question = await questionCreator()
        if (!(await shouldSavePrompt())) {
            continue rootOptionLoop
        }

        await db?.createQuestion(question)
    } else if (chosenRootOption == RootPromptOption.Connect) {
        const chosenDataSource = await Select.prompt({
            message: "Choose a data source to connect to",
            options: Object.values(DataSource)
        })
        
        if (chosenDataSource == DataSource.MongoDB) {
            const connectionString = await Input.prompt("Please enter the connection URI: ")
            if (!validateMongoConnectionURI(connectionString)) {
                console.log(formatErrorString("Invalid connection URI"))
                continue
            }
            const connectionConfig = { connectionURI: connectionString } as MongoConnectionConfig
            db = new MongoDriver(connectionConfig)
            await db.connect()
        } else {
            unimplementedError()
        }
    } else if (chosenRootOption == RootPromptOption.Disconnect) {
        if (isConnected()) {
            db?.disconnect()
        }
    } else if (chosenRootOption == RootPromptOption.Exit) {
        if (isConnected()) {
            db?.disconnect()
        }
        
        Deno.exit(0)
    } else {
        unimplementedError()
    }
}