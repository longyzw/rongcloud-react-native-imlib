import { NativeEventEmitter, NativeModules, Platform } from "react-native";

const { RCIMClient } = NativeModules;
const eventEmitter = new NativeEventEmitter(RCIMClient);

/**
 * 初始化 SDK，只需要调用一次
 */
export function init(appKey: string) {
  RCIMClient.init(appKey);
}

/**
 * 连接融云服务器，只需要调用一次
 *
 * @param token
 * @param success 成功回调函数
 * @param error 失败回调函数
 * @param tokenIncorrect token 错误或过期回调函数
 */
export function connect(
  token: string,
  success: (userId: string) => void = null,
  error: (errorCode: number) => void = null,
  tokenIncorrect: () => void = null
) {
  const eventId = Math.random().toString();
  const listener = eventEmitter.addListener("rcimlib-connect", data => {
    if (data.eventId === eventId) {
      if (data.type === "success") {
        success && success(data.userId);
      } else if (data.type === "error") {
        error && error(data.errorCode);
      } else if (data.type === "tokenIncorrect") {
        tokenIncorrect && tokenIncorrect();
      }
      listener.remove();
    }
  });
  RCIMClient.connect(token, eventId);
}

/**
 * 消息方向
 */
export enum MessageDirection {
  SEND = 1,
  RECEIVE
}

/**
 * 会话类型
 */
export enum ConversationType {
  PRIVATE = 1,
  DISCUSSION,
  GROUP,
  CHATROOM,
  CUSTOMER_SERVICE,
  SYSTEM,
  APP_SERVICE,
  PUBLIC_SERVICE,
  PUSH_SERVICE
}

export type TextMessage = {
  type: "text";
  content: string;
  extra?: string;
};

export type ImageMessage = {
  type: "image";
  local: string;
  remote?: string;
  thumbnail?: string;
  isFull?: string;
  extra?: string;
};

export type FileMessage = {
  type: "file";
  local: string;
  remote?: string;
  name?: string;
  size?: number;
  fileType?: string;
  extra?: string;
};

export type MessageContent = TextMessage | ImageMessage | FileMessage;

export type Message = {
  /**
   * 会话类型
   */
  conversationType: ConversationType;

  /**
   * 消息 ID
   */
  messageId: number;

  /**
   * 消息 UID
   */
  messageUId: string;

  /**
   * 消息方向
   */
  messageDirection: MessageDirection;

  /**
   * 发送者 ID
   */
  senderUserId: string;

  /**
   * 发送时间
   */
  sentTime: number;

  /**
   * 目标 ID
   */
  targetId: string;

  /**
   * 消息接收时间
   */
  receivedTime: number;

  /**
   * 消息内容
   */
  content: MessageContent;

  /**
   * 附加信息
   */
  extra?: string;
};

/**
 * 添加消息监听函数
 */
export function addReceiveMessageListener(listener: (message: Message) => void) {
  return eventEmitter.addListener("rcimlib-receive-message", message => {
    listener(message);
  });
}

export type SentMessage = {
  conversationType: ConversationType;
  targetId: string;
  content: TextMessage;
  pushContent: string;
  pushData: string;
};

export type SentMessageCallback = {
  success?: (message: Message) => void;
  error?: (errorCode: number) => void;
};

export enum MessageObjectNamesAndroid {
  text = "RC:TxtMsg",
  image = "RC:ImgMsg",
  file = "RC:FileMsg"
}

export const MessageObjectNames = Platform.select({ android: MessageObjectNamesAndroid });

/**
 * 发送消息
 *
 * @param message 消息
 * @param callback 回调
 */
export function sendMessage(message: SentMessage, callback: SentMessageCallback = null) {
  const eventId = Math.random().toString();
  if (callback) {
    const listener = eventEmitter.addListener("rcimlib-send-message", data => {
      if (data.eventId === eventId) {
        const { success, error } = callback;
        if (data.type === "success") {
          success && success(data.message);
          listener.remove();
        } else if (data.type === "error") {
          error && error(data.errorCode);
          listener.remove();
        }
      }
    });
  }
  RCIMClient.sendMessage(message, eventId);
}

export enum ConnectionStatusIOS {
  UNKNOWN = -1,
  Connected = 0,
  NETWORK_UNAVAILABLE = 1,
  AIRPLANE_MODE = 2,
  Cellular_2G = 3,
  Cellular_3G_4G = 4,
  WIFI = 5,
  KICKED_OFFLINE_BY_OTHER_CLIENT = 6,
  LOGIN_ON_WEB = 7,
  SERVER_INVALID = 8,
  VALIDATE_INVALID = 9,
  Connecting = 10,
  Unconnected = 11,
  SignUp = 12,
  TOKEN_INCORRECT = 31004,
  DISCONN_EXCEPTION = 31011
}

export enum ConnectionStatusAndroid {
  NETWORK_UNAVAILABLE = -1,
  CONNECTED,
  CONNECTING,
  DISCONNECTED,
  KICKED_OFFLINE_BY_OTHER_CLIENT,
  TOKEN_INCORRECT,
  SERVER_INVALID
}

export type ConnectionStatus = ConnectionStatusIOS | ConnectionStatusAndroid;

/**
 * 添加消息监听函数
 */
export function addConnectionStatusListener(listener: (status: ConnectionStatus) => void) {
  return eventEmitter.addListener("rcimlib-connection-status", listener);
}

export function getHistoryMessages(
  conversationType: ConversationType,
  targetId: string,
  objectName = "",
  oldestMessageId = -1,
  count = 10
) {
  return RCIMClient.getHistoryMessages(
    conversationType,
    targetId,
    objectName,
    oldestMessageId,
    count
  );
}