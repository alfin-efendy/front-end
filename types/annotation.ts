import { TitlePosition } from "@/types/canvas";
import { LabelInput } from "@/types/label";

export type Annotation = {
  id?: string;
  taskId: string;
  labelId?: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  titlePosition?: TitlePosition;
  createdAt?: Date;
  createdBy?: string;
  updatedAt?: Date;
  updatedBy?: string;
};

export type AnnotationClient = Annotation & {
  tmpId: string;
  labelName: string;
  type: string;
  color: string;
};

export type InitialAnnotationData = {
    annotations: AnnotationClient[];
    urlFile: string;
    taskId: string;
    labels: LabelInput[];
}