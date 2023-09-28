import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";

enum Operator {
  Add = '+',
  Subtract = '-',
  Multiply = '*',
  Divide = '/'
}

const PRECEDENCE_LOW = 1;
const PRECEDENCE_HIGH = 2;
export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  evaluate(formula: FormulaType) {
    // set the this._result to the length of the formula

    this._errorMessage = ErrorMessages.emptyFormula;
    this._result = 0;

    if (formula.length === 0) {
      return;
    }

    const values: number[] = [];
    const operators: string[] = [];
    const calculate = this.calculate.bind(this, values);

    for (const token of formula) {
      if (this.isNumber(token)) {
        values.push(Number(token));
      } else if (this.isCellReference(token)) {
        const [value, cellError] = this.getCellValue(token);
        if (cellError) {
          this._result = value;
          this._errorMessage = cellError;
          
        } else {
          values.push(value);
        }
      } else {
        this.handleToken(token, values, operators, calculate);
      }
    }
    while (operators.length) {
      calculate(operators.pop()!);
    }
        
    if (values.length === 1 && this._errorMessage !== ErrorMessages.invalidFormula) {
      this._result = values[0];
      this._errorMessage = "";
    } else if (values.length === 0 && this._errorMessage === ErrorMessages.emptyFormula) {
      this._result = 0;
      this._errorMessage = ErrorMessages.missingParentheses;
    } 
  }

  handleToken(token: TokenType, values: number[], operators: string[], calculate: (operator: string) => void) {
    switch (token) {
      case Operator.Add:
      case Operator.Subtract:
      case Operator.Multiply:
      case Operator.Divide:
        while (operators.length && this.getPrecedence(operators[operators.length - 1]) >= this.getPrecedence(token as string)) {
          calculate(operators.pop()!);
        }
        operators.push(token as string);
        break;
      case '(':
        operators.push(token as string);
        break;
      case ')':
        while (operators.length && operators[operators.length - 1] !== '(') {
          calculate(operators.pop()!);
        }
        operators.pop();
        break;
      default:
        throw new Error(ErrorMessages.invalidFormula);
    }
  }

  calculate(values: number[], operator: string) {
    if (values.length === 0) {
      return;
    }
    if (values.length < 2) {
      this._errorMessage = ErrorMessages.invalidFormula;
      this._result = values.pop()!;
      return;

    }
    const right = values.pop()!;
    const left = values.pop()!;

    switch (operator) {
      case Operator.Add:
        values.push(left + right);
        break;
      case Operator.Subtract:
        values.push(left - right);
        break;
      case Operator.Multiply:
        values.push(left * right);
        break;
      case Operator.Divide:
        if (right === 0) {
          this._errorMessage = ErrorMessages.divideByZero;
          this._result = Infinity;
        } else {
          values.push(left / right);
        }
        break;
      default:
        throw new Error(ErrorMessages.invalidFormula);
      }
    }

  getPrecedence(operator: string): number {
    switch (operator) {
      case Operator.Add:
      case Operator.Subtract:
        return PRECEDENCE_LOW;
      case Operator.Multiply:
      case Operator.Divide:
        return PRECEDENCE_HIGH;
      default:
        return 0;
    }
  }


  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }




  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;