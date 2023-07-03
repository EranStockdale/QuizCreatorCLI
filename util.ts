import { Confirm } from "https://deno.land/x/cliffy@v0.25.7/prompt/confirm.ts";

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVQXYZ".toLowerCase()

export function isNumeric(str: string): boolean {
    /**
     * Check if a string is numeric.
     * 
     * @param {string} str - The string to check
     */

    return !Number.isNaN(Number(str))
}

export function isSingleLetter(str: string): boolean {
    return str.length == 1 && LETTERS.includes(str.toLowerCase())
}

// deno-lint-ignore no-inferrable-types
export function getLetterIndex(letter: string, zero_indexed: boolean = true): number {
    if (!isSingleLetter(letter)) {
        throw new Error("Cannot get letter number for a string that is not a single letter")
    }

    return LETTERS.indexOf(letter.toLowerCase()) + (zero_indexed ? 0 : 1)
}

export async function shouldSavePrompt() {
    const shouldSave: boolean = await Confirm.prompt("Save?")

    if (!shouldSave) {
        console.log("Okay, discarded.")
    }

    return Promise.resolve(shouldSave)
}