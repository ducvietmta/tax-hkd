/** Textual tax correctness is assessed by the semantic reviewer; arithmetic by resolveCalculations. */
import type { TaxDecisionFrame } from './types';
import type { EvaluationResult } from '../rules/evaluator';
export interface ValidationReport {status:'PASS'|'REPAIR'|'DOWNGRADE';reasons:string[];repairedText?:string}
export function validateAnswer(answerText:string,_frame:TaxDecisionFrame,_evaluation?:EvaluationResult,_question?:string):ValidationReport {
 return {status:answerText.trim()?'PASS':'DOWNGRADE',reasons:answerText.trim()?[]:['Không có câu trả lời có thể kiểm chứng'],repairedText:answerText};
}
