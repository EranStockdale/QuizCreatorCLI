export enum QuestionType {
    MULTIPLE_CHOICE = "Multiple Choice",
    NUMERIC = "Numeric",
    STRING = "String (Text)"
}

export interface Question {
    id: string
    type?: QuestionType
    questionString?: string
    tags?: string[]
    choices: string[]
    answer?: string | number
}
