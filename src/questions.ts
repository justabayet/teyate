import type { Question } from "./SessionPage";


export const WAITING_SCREEN_INDEX = -1;
export const SHOW_RESULTS_INDEX = -2;
export const END_SCREEN_INDEX = -3;
export const WELCOME_SCREEN_INDEX = -4;

export const getQuestion = (index: number | undefined | null, questions: Question[] | undefined) => {
    if (index === WAITING_SCREEN_INDEX) {
        return { id: 'waiting', text: '...', answers: [] };
    } else if (index === END_SCREEN_INDEX) {
        return { id: 'end', text: 'Thank you for coming!', answers: [] };
    } else if (index === SHOW_RESULTS_INDEX) {
        return { id: 'results', text: 'Results Screen', answers: [] };
    } else if (index === WELCOME_SCREEN_INDEX) {
        return { id: 'welcome', text: 'Welcome!', answers: [] };
    } else if (index != null && questions) {
        return questions[index] || null;
    }
    return null;
}