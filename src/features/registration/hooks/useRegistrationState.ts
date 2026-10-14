import { useReducer, useEffect } from 'react';
import type { PathId, RegState } from '../types';

const STORAGE_KEY = 'taxhkd.reg.v1';

export const INITIAL_REG_STATE: RegState = {
  version: 1,
  pathId: null,
  quizAnswers: {},
  currentStepId: null,
  doneSteps: [],
  checkedDocs: [],
  updatedAt: Date.now(),
};

export type RegAction =
  | { type: 'SET_PATH'; payload: { pathId: PathId; initialStepId?: string } }
  | { type: 'SET_QUIZ_ANSWER'; payload: { questionId: string; answerId: string } }
  | { type: 'RESET_QUIZ' }
  | { type: 'SET_STEP'; payload: string }
  | { type: 'TOGGLE_STEP_DONE'; payload: string }
  | { type: 'TOGGLE_DOC_CHECKED'; payload: string }
  | { type: 'RESET_ALL' };

function regReducer(state: RegState, action: RegAction): RegState {
  const now = Date.now();
  switch (action.type) {
    case 'SET_PATH': {
      return {
        ...state,
        pathId: action.payload.pathId,
        currentStepId: action.payload.initialStepId ?? state.currentStepId,
        updatedAt: now,
      };
    }
    case 'SET_QUIZ_ANSWER': {
      return {
        ...state,
        quizAnswers: {
          ...state.quizAnswers,
          [action.payload.questionId]: action.payload.answerId,
        },
        updatedAt: now,
      };
    }
    case 'RESET_QUIZ': {
      return {
        ...state,
        quizAnswers: {},
        pathId: null,
        currentStepId: null,
        updatedAt: now,
      };
    }
    case 'SET_STEP': {
      return {
        ...state,
        currentStepId: action.payload,
        updatedAt: now,
      };
    }
    case 'TOGGLE_STEP_DONE': {
      const stepId = action.payload;
      const isDone = state.doneSteps.includes(stepId);
      return {
        ...state,
        doneSteps: isDone
          ? state.doneSteps.filter((id) => id !== stepId)
          : [...state.doneSteps, stepId],
        updatedAt: now,
      };
    }
    case 'TOGGLE_DOC_CHECKED': {
      const docId = action.payload;
      const isChecked = state.checkedDocs.includes(docId);
      return {
        ...state,
        checkedDocs: isChecked
          ? state.checkedDocs.filter((id) => id !== docId)
          : [...state.checkedDocs, docId],
        updatedAt: now,
      };
    }
    case 'RESET_ALL': {
      return {
        ...INITIAL_REG_STATE,
        updatedAt: now,
      };
    }
    default:
      return state;
  }
}

function loadPersistedState(): RegState {
  if (typeof window === 'undefined') return INITIAL_REG_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_REG_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return {
        ...INITIAL_REG_STATE,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to parse persisted registration state:', e);
  }
  return INITIAL_REG_STATE;
}

export function useRegistrationState() {
  const [state, dispatch] = useReducer(regReducer, undefined, loadPersistedState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist registration state to localStorage:', e);
    }
  }, [state]);

  return {
    state,
    setPath: (pathId: PathId, initialStepId?: string) =>
      dispatch({ type: 'SET_PATH', payload: { pathId, initialStepId } }),
    setQuizAnswer: (questionId: string, answerId: string) =>
      dispatch({ type: 'SET_QUIZ_ANSWER', payload: { questionId, answerId } }),
    resetQuiz: () => dispatch({ type: 'RESET_QUIZ' }),
    setStep: (stepId: string) => dispatch({ type: 'SET_STEP', payload: stepId }),
    toggleStepDone: (stepId: string) => dispatch({ type: 'TOGGLE_STEP_DONE', payload: stepId }),
    toggleDocChecked: (docId: string) => dispatch({ type: 'TOGGLE_DOC_CHECKED', payload: docId }),
    resetAll: () => dispatch({ type: 'RESET_ALL' }),
  };
}
