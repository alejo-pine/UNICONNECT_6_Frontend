import { useEffect, useState } from 'react';
import type { WallAttachment } from '../../domain/wall';
import { wallHttpService } from '../../infrastructure/wallHttpService';
import { getAttachmentDisplayType } from '@shared/utils/file';
import {
  BaseAttachmentDisplay,
  ImageAttachmentDecorator,
  PdfAttachmentDecorator,
  ExcelAttachmentDecorator,
  type IAttachmentDisplay,
} from './attachmentDisplayDecorators';

type GetUrlFn = (id: string) => Promise<{ success: boolean; data?: string }>;

interface Props {
  attachment: WallAttachment;
  getUrl?: GetUrlFn;
}

export function AttachmentRenderer({
  attachment,
  getUrl = (id) => wallHttpService.getAttachmentUrl(id),
}: Props) {
  const type = getAttachmentDisplayType(attachment.fileType, attachment.fileName);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (type !== 'image' || !attachment.id) return;
    getUrl(attachment.id).then((res) => {
      if (res.success && res.data) setImageUrl(res.data);
    });
  }, [type, attachment.id, getUrl]);

  const openAttachment = async () => {
    if (!attachment.id) return;
    if (type === 'image' && imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const result = await getUrl(attachment.id);
    if (result.success && result.data) {
      window.open(result.data, '_blank', 'noopener,noreferrer');
    }
  };

  // Decorator chain: start with the base component and wrap it with the
  // concrete decorator that matches the file type.
  let display: IAttachmentDisplay = new BaseAttachmentDisplay();
  if (type === 'pdf')   display = new PdfAttachmentDecorator(display);
  if (type === 'excel') display = new ExcelAttachmentDecorator(display);
  if (type === 'image') display = new ImageAttachmentDecorator(display);

  return display.render({ attachment, onOpen: openAttachment, imageUrl });
}
