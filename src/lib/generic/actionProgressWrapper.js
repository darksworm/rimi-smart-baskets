export default class ActionProgressWrapper {
    constructor(actionable) {
        this.handler = {
            onStart: () => { },
            onProgress: () => { },
            onComplete: () => { }
        };
        this.actionable = actionable;
    }

    setHandler(handler) {
        this.handler = handler;
    }

    async doAction() {
        this.handler.onStart();
        await this.actionable.doAction(
            this.handler.onProgress.bind(this.handler),
            ...arguments
        );
        this.handler.onComplete();
    }
}