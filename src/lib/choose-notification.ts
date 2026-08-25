import { notifications } from '@mantine/notifications';

type INotificationPosition =
  'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

interface INotificationOptions {
  message: string;
  title?: string;
  position?: INotificationPosition;
}

interface ILoaderNotificationOptions {
  message?: string;
  title?: string;
  position?: INotificationPosition;
}

interface ILoadingTransitionOptions extends INotificationOptions {
  id: string;
}

interface ILoadingNotificationUpdateOptions {
  id: string;
  message: string;
  title?: string;
  position?: INotificationPosition;
}

interface ITransientNotificationOptions extends INotificationOptions {
  autoClose?: number | false;
  id: string;
}

const DEFAULT_POSITION: INotificationPosition = 'bottom-right';
const DEFAULT_AUTO_CLOSE = 3000;
const DEFAULT_LOADING_MESSAGE = 'Please wait...';
const ACTIVE_TRANSIENT_NOTIFICATION_IDS = new Set<string>();

// Notifications are centralized so product feedback stays consistent while the UI library can evolve.
export const ChooseNotification = {
  success({ message, title = 'Success', position = DEFAULT_POSITION }: INotificationOptions): void {
    notifications.show({
      title,
      message,
      color: 'green',
      position,
      autoClose: DEFAULT_AUTO_CLOSE,
    });
  },

  failure({ message, title = 'Error', position = DEFAULT_POSITION }: INotificationOptions): void {
    notifications.show({
      title,
      message,
      color: 'red',
      position,
      autoClose: DEFAULT_AUTO_CLOSE + 2000,
    });
  },

  info({
    message,
    title = 'Information',
    position = DEFAULT_POSITION,
  }: INotificationOptions): void {
    notifications.show({
      title,
      message,
      color: 'blue',
      position,
      autoClose: DEFAULT_AUTO_CLOSE,
    });
  },

  // Drag feedback changes quickly, so one stable notification is updated instead of stacking messages.
  transientInfo({
    id,
    message,
    title = 'Builder',
    position = DEFAULT_POSITION,
    autoClose = false,
  }: ITransientNotificationOptions): void {
    const notification = {
      id,
      title,
      message,
      color: 'blue',
      position,
      autoClose,
      onClose: () => ACTIVE_TRANSIENT_NOTIFICATION_IDS.delete(id),
    };

    if (ACTIVE_TRANSIENT_NOTIFICATION_IDS.has(id)) {
      notifications.update(notification);
      return;
    }

    ACTIVE_TRANSIENT_NOTIFICATION_IDS.add(id);
    notifications.show(notification);
  },

  dismiss(id: string): void {
    ACTIVE_TRANSIENT_NOTIFICATION_IDS.delete(id);
    notifications.hide(id);
  },

  warning({ message, title = 'Warning', position = DEFAULT_POSITION }: INotificationOptions): void {
    notifications.show({
      title,
      message,
      color: 'yellow',
      position,
      autoClose: DEFAULT_AUTO_CLOSE + 2000,
    });
  },

  loader({
    message = DEFAULT_LOADING_MESSAGE,
    title = 'Loading',
    position = DEFAULT_POSITION,
  }: ILoaderNotificationOptions = {}): string {
    return notifications.show({
      title,
      message,
      color: 'blue',
      position,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
  },

  loading({
    id,
    message,
    title = 'Loading',
    position = DEFAULT_POSITION,
  }: ILoadingNotificationUpdateOptions): void {
    notifications.update({
      id,
      title,
      message,
      color: 'blue',
      position,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
  },

  loadingToSuccess({
    id,
    message,
    title = 'Success',
    position = DEFAULT_POSITION,
  }: ILoadingTransitionOptions): void {
    notifications.update({
      id,
      title,
      message,
      color: 'green',
      position,
      loading: false,
      autoClose: DEFAULT_AUTO_CLOSE,
      withCloseButton: true,
    });
  },

  loadingToFailure({
    id,
    message,
    title = 'Error',
    position = DEFAULT_POSITION,
  }: ILoadingTransitionOptions): void {
    notifications.update({
      id,
      title,
      message,
      color: 'red',
      position,
      loading: false,
      autoClose: DEFAULT_AUTO_CLOSE + 2000,
      withCloseButton: true,
    });
  },
};
