import {ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments} from "class-validator";

@ValidatorConstraint({ name: "customText", async: false })
export class addVal implements ValidatorConstraintInterface {

    // validate(text: string, args: ValidationArguments) {
    //     return text.length > 1 && text.length < 10; // for async validations you must return a Promise<boolean> here
    // }

    // defaultMessage(args: ValidationArguments) { // here you can provide default error message if validation failed
    //     return "Text ($value) is too short or too long!";
    // }

}

export const addValidate = addVal('query')