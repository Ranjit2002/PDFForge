import { PDFDocument } from 'pdf-lib';

export interface DetectedFormField {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button' | 'unknown';
  value: string | boolean;
  options?: string[];
  isReadOnly: boolean;
}

export interface NewFormField {
  type: 'text' | 'checkbox';
  name: string;
  pageIndex: number;
  x: number; // pt
  y: number; // pt
  width: number;
  height: number;
  defaultValue?: string | boolean;
}

/**
 * Inspects a PDF and retrieves all interactive AcroForm fields
 */
export async function getPdfFormFields(buffer: ArrayBuffer): Promise<DetectedFormField[]> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  return fields.map(field => {
    const name = field.getName();
    const typeName = field.constructor.name;
    let type: DetectedFormField['type'] = 'unknown';
    let value: string | boolean = '';
    let options: string[] | undefined = undefined;

    if (typeName.includes('PDFTextField')) {
      type = 'text';
      try {
        value = (field as any).getText() || '';
      } catch {}
    } else if (typeName.includes('PDFCheckBox')) {
      type = 'checkbox';
      try {
        value = (field as any).isChecked();
      } catch {}
    } else if (typeName.includes('PDFDropdown')) {
      type = 'dropdown';
      try {
        options = (field as any).getOptions();
        value = ((field as any).getSelected() || [])[0] || '';
      } catch {}
    } else if (typeName.includes('PDFRadioGroup')) {
      type = 'radio';
      try {
        options = (field as any).getOptions();
        value = (field as any).getSelected() || '';
      } catch {}
    } else if (typeName.includes('PDFButton')) {
      type = 'button';
    }

    return {
      name,
      type,
      value,
      options,
      isReadOnly: field.isReadOnly(),
    };
  });
}

/**
 * Fills existing form fields in a PDF
 */
export async function fillPdfForm(
  buffer: ArrayBuffer,
  fieldValues: Record<string, string | boolean>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (typeof val === 'boolean') {
        const checkbox = form.getCheckBox(name);
        if (val) checkbox.check();
        else checkbox.uncheck();
      } else if (typeof val === 'string') {
        try {
          const textField = form.getTextField(name);
          textField.setText(val);
        } catch {
          try {
            const dropdown = form.getDropdown(name);
            dropdown.select(val);
          } catch {}
        }
      }
    } catch (err) {
      console.warn(`Could not set value for field "${name}":`, err);
    }
  }

  return await pdfDoc.save();
}

/**
 * Adds new interactive form fields onto PDF pages
 */
export async function addNewFormFields(
  buffer: ArrayBuffer,
  newFields: NewFormField[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  newFields.forEach(nf => {
    if (nf.pageIndex < 0 || nf.pageIndex >= pages.length) return;
    const page = pages[nf.pageIndex];

    if (nf.type === 'text') {
      const textField = form.createTextField(nf.name);
      textField.addToPage(page, {
        x: nf.x,
        y: nf.y,
        width: nf.width,
        height: nf.height,
      });
      if (nf.defaultValue && typeof nf.defaultValue === 'string') {
        textField.setText(nf.defaultValue);
      }
    } else if (nf.type === 'checkbox') {
      const checkBox = form.createCheckBox(nf.name);
      checkBox.addToPage(page, {
        x: nf.x,
        y: nf.y,
        width: nf.width,
        height: nf.height,
      });
      if (nf.defaultValue === true) {
        checkBox.check();
      }
    }
  });

  return await pdfDoc.save();
}
