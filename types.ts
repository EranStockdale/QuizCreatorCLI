import { getLetterIndex, isNumeric, isSingleLetter } from './util.ts';

export enum QuestionType {
    MULTIPLE_CHOICE = "Multiple Choice",
    NUMERIC = "Numeric",
    STRING = "String (Text)"
}

export interface Question {
    id: string
    type: QuestionType
    questionString?: string
    tags?: string[]
    choices: string[]
    correctChoice?: number
    answer?: string | number
}

export function validateQuestionAnswer(question: Question, answer: string): boolean {
    /**
     * @param {Question} question - The question you wish to validate the answer for
     * @param {boolean} answer - The answer to validate
     */

    if (question.type == QuestionType.NUMERIC) {
        return isNumeric(answer)
    } else if (question.type == QuestionType.STRING) {
        return true
    } else if (question.type == QuestionType.MULTIPLE_CHOICE) {
        let choiceIndex = -1
        
        if (isSingleLetter(answer) && question.choices.length <= 26) { // can convert letter to number
            choiceIndex = getLetterIndex(answer, true)
        } else if (isSingleLetter(answer) && question.choices.length > 26) { // is letter but cannot be converted
            return false
        } else if (isNumeric(answer)) { // its a number, check if it's small enough
            return +answer <= question.choices.length
        } else { // none of the above conidtions apply, it's a string or something
            return false
        }

        return choiceIndex + 1 <= question.choices.length // check if choice index if small enough
    }

    throw new Error("Question is of undefined type. Type: " + question.type)
}