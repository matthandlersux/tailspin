import { combineReducers } from 'redux';
function logData(state = { files: {} }, action) {
    switch (action.type) {
        case 'ADD_LOG_LINE':
            const { filePath, line } = action.payload;
            const existingLines = state.files[filePath] || [];
            return Object.assign(Object.assign({}, state), { [filePath]: [...existingLines, line] });
        default:
            return state;
    }
}
export const reducer = combineReducers({
    logData,
});
