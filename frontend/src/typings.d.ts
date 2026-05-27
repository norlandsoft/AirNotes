/**
 * air-design 组件库类型声明
 *
 * air-design 没有内置 TypeScript 类型定义，
 * 此文件为项目中使用的组件提供类型声明，消除 TS 编译错误。
 *
 * Created by ChaiMingXu, on 2026/05/27
 */

// .less 模块声明
declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'air-design' {
  import {ComponentType, ReactNode, Ref} from 'react';

  // antd 转发组件 —— 直接重导出 antd 的类型
  export {
    Form, Input, Select, DatePicker, TimePicker, InputNumber, Checkbox, Switch, Slider, Rate, Upload, Cascader, TreeSelect,
    Card, Tag, Statistic, Avatar, Badge, Timeline, Tooltip, Popover, Popconfirm, Empty, Typography, Image, Calendar, Descriptions,
    Modal, Drawer, Alert, Progress, Result, Skeleton,
    Layout, Row, Col, Divider, Space,
    Menu, Dropdown, Breadcrumb, Steps, Pagination, Tabs, Anchor,
    Radio, AutoComplete, Watermark, FloatButton, ConfigProvider, App,
    notification, theme,
  } from 'antd';

  // antd 类型重导出
  export type {
    FormProps, FormInstance, FormItemProps, InputProps, SelectProps, DatePickerProps, TimeRangePickerProps,
    InputNumberProps, CheckboxProps, SwitchProps, UploadProps,
    CardProps, TagProps, StatisticProps, AvatarProps, BadgeProps, TooltipProps, PopoverProps, PopconfirmProps, TypographyProps,
    ModalProps, DrawerProps, AlertProps,
    LayoutProps, RowProps, ColProps,
    MenuProps, DropdownProps, BreadcrumbProps, PaginationProps, TabsProps,
    RadioProps, RadioChangeEvent, ConfigProviderProps,
  } from 'antd';

  // air-design 自有组件
  export interface IconProps {
    name?: string;
    size?: number;
    thickness?: number;
    className?: string;
    onClick?: () => void;
  }
  export const Icon: ComponentType<IconProps>;

  export interface IconButtonProps {
    icon?: string;
    size?: number;
    onClick?: () => void;
    className?: string;
    children?: ReactNode;
  }
  export const IconButton: ComponentType<IconButtonProps>;

  export interface SpinProps {
    loading?: boolean;
    label?: string;
    spinning?: boolean;
    fullscreen?: boolean;
    description?: string;
    children?: ReactNode;
  }
  export const Spin: ComponentType<SpinProps>;

  export interface NoticeStatic {
    success(title: string, message: string): void;
    warning(title: string, message: string): void;
    error(title: string, message: string): void;
    info(title: string, message: string): void;
  }
  export const Notice: NoticeStatic;

  export interface DialogOptions {
    title?: string;
    message?: string;
    content?: ReactNode;
    width?: number;
    okText?: string;
    cancelText?: string;
    onConfirm?: (dlg: any) => void;
    onCancel?: (dlg: any) => void;
  }
  export function Dialog(options: DialogOptions): void;

  export interface SlidePanelProps {
    type?: 'small' | 'medium' | 'full';
    title?: string;
    open?: boolean;
    maskClosable?: boolean;
    hasButtonBar?: boolean;
    hasCloseButton?: boolean;
    bodyPadding?: number;
    confirmButtonText?: string;
    closeButtonText?: string;
    onConfirm?: () => void;
    onClose?: () => void;
    children?: ReactNode;
  }
  export const SlidePanel: ComponentType<SlidePanelProps>;

  export interface BreadcrumbProps {
    className?: string;
    items?: Array<{
      key: string;
      title: string;
      onClick?: () => void;
    }>;
    compact?: boolean;
    children?: ReactNode;
  }
  export const Breadcrumb: ComponentType<BreadcrumbProps>;

  export interface RichEditorProps {
    docId?: string;
    showUndo?: boolean;
    padding?: number;
    height?: number;
    width?: number;
    contentPadding?: number;
    bordered?: boolean;
    simpleMode?: boolean;
    fixedHeight?: boolean;
  }
  export const RichEditor: ComponentType<RichEditorProps & {ref?: Ref<any>}>;

  export interface SplitterProps {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    split?: 'vertical' | 'horizontal';
    primary?: 'first' | 'second';
    defaultSize?: string | number;
    minSize?: string | number;
    maxSize?: string | number;
    onChange?: (newSize: number) => void;
    collapsible?: boolean;
  }
  export const Splitter: ComponentType<SplitterProps>;
  export const Pane: ComponentType<any>;

  export const Tree: ComponentType<any>;
  export const Table: ComponentType<any>;

  export interface ButtonProps {
    type?: string;
    htmlType?: 'submit' | 'reset' | 'button';
    onClick?: (event: any) => void;
    style?: React.CSSProperties;
    disabled?: boolean;
    icon?: ReactNode | string;
    loading?: boolean;
    block?: boolean;
    size?: 'small' | 'middle' | 'large';
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
  }
  export const Button: ComponentType<ButtonProps>;

  export interface MessageStatic {
    info: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    success: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    error: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    warning: (content: ReactNode, duration?: number, onClose?: () => void) => void;
    loading: (content: ReactNode, duration?: number, onClose?: () => void) => void;
  }
  export const Message: MessageStatic;
  export const EditableLabel: ComponentType<any>;
  export const PropertiesNaviBar: ComponentType<any>;
  export const MindPanel: ComponentType<any>;
  export type MindData = any;
  export type MindNodeData = any;
}
