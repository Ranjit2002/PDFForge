import { compressPdf, COMPRESSION_PRESETS, CompressionPreset } from './compressEngine';
import { rotatePdf } from './rotateEngine';
import { applyWatermark } from './watermarkEngine';
import { addPageNumbers, PageNumberPosition } from './pageNumberEngine';
import { cropPdf } from './cropEngine';
import { convertToPdfA } from './pdfaEngine';
import { repairPdf } from './repairEngine';
import { protectPdf } from './protectEngine';

export interface WorkflowStep {
  id: string;
  toolType:
    | 'compress'
    | 'rotate'
    | 'watermark'
    | 'pageNumbers'
    | 'crop'
    | 'pdfa'
    | 'repair'
    | 'protect';
  title: string;
  config: Record<string, any>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStepProgress {
  stepIndex: number;
  stepId: string;
  toolTitle: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

/**
 * Executes a pipeline of PDF tools sequentially on a source PDF buffer
 */
export async function executeWorkflow(
  initialBuffer: ArrayBuffer,
  steps: WorkflowStep[],
  onStepProgress?: (progress: WorkflowStepProgress) => void
): Promise<Uint8Array> {
  let currentBytes: any = new Uint8Array(initialBuffer);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (onStepProgress) {
      onStepProgress({
        stepIndex: i,
        stepId: step.id,
        toolTitle: step.title,
        status: 'running',
      });
    }

    try {
      const buffer = currentBytes.buffer.slice(
        currentBytes.byteOffset,
        currentBytes.byteOffset + currentBytes.byteLength
      );

      switch (step.toolType) {
        case 'compress': {
          const presetName: CompressionPreset = (step.config.preset as CompressionPreset) || 'recommended';
          const presetConfig = COMPRESSION_PRESETS[presetName === 'custom' ? 'recommended' : presetName] || COMPRESSION_PRESETS.recommended;
          const result = await compressPdf(buffer, presetConfig);
          currentBytes = result.data;
          break;
        }

        case 'rotate': {
          const angle = Number(step.config.angle || 90);
          currentBytes = await rotatePdf(buffer, { globalRotation: angle });
          break;
        }

        case 'watermark': {
          const text = step.config.text || 'CONFIDENTIAL';
          const opacity = Number(step.config.opacity ?? 0.3);
          const position = step.config.position || 'center';
          currentBytes = await applyWatermark(buffer, {
            type: 'text',
            text,
            opacity,
            position,
          });
          break;
        }

        case 'pageNumbers': {
          const position: PageNumberPosition = step.config.position || 'bottom-right';
          const format = step.config.format || 'Page {n} of {total}';
          currentBytes = await addPageNumbers(buffer, { position, format });
          break;
        }

        case 'crop': {
          const m = step.config.margins || { topPercent: 5, bottomPercent: 5, leftPercent: 5, rightPercent: 5 };
          currentBytes = await cropPdf(buffer, m);
          break;
        }

        case 'pdfa': {
          const { pdfBytes } = await convertToPdfA(buffer, { standard: 'PDF/A-1b' });
          currentBytes = pdfBytes;
          break;
        }

        case 'repair': {
          const { pdfBytes } = await repairPdf(buffer);
          currentBytes = pdfBytes;
          break;
        }

        case 'protect': {
          const password = step.config.password || '123456';
          currentBytes = await protectPdf(buffer, password);
          break;
        }

        default:
          throw new Error(`Unsupported workflow step type: ${step.toolType}`);
      }

      if (onStepProgress) {
        onStepProgress({
          stepIndex: i,
          stepId: step.id,
          toolTitle: step.title,
          status: 'completed',
        });
      }
    } catch (err: any) {
      if (onStepProgress) {
        onStepProgress({
          stepIndex: i,
          stepId: step.id,
          toolTitle: step.title,
          status: 'failed',
          error: err.message || 'Step execution failed',
        });
      }
      throw new Error(`Step ${i + 1} (${step.title}) failed: ${err.message}`);
    }
  }

  return currentBytes;
}
