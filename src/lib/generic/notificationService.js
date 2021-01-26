export default class NotificationService {
    constructor(notificationServiceProvider) {
        this.provider = notificationServiceProvider;
    }

    success(message, duration) {
        this.provider.success({
            message: message,
            duration: duration,
            className: "rimi-smart-basket-notification success",
            position: {
                x: 'right',
                y: 'top'
            }
        })
    }
}