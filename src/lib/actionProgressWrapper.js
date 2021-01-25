export default class ActionProgressWrapper {
    constructor(actionable) {
        this.callbacks = {
            onStart: () => {
            },
            onProgress: () => {
            },
            onComplete: () => {
            }
        };
        this.actionable = actionable;
    }

    onStart(fun) {
        this.callbacks.onStart = fun;
    }

    onProgress(fun) {
        this.callbacks.onProgress = fun;
    }

    onComplete(fun) {
        this.callbacks.onComplete = fun;
    }

    async doAction() {
        this.callbacks.onStart();
        await this.actionable.doAction(this.callbacks.onProgress, ...arguments);
        this.callbacks.onComplete();
    }
}