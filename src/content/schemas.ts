import { z } from 'zod';
import { WING_IDS } from './wings';
import { TOOLS } from './zones';

export const WingSchema = z.enum(WING_IDS);
export const StatusSchema = z.enum(['draft', 'validated']);
export const PracticeModeSchema = z.enum(['garde-rapide', 'memo', 'qui-suis-je']);
const Difficulty = z.number().int().min(1).max(3);
const NonEmpty = z.string().trim().min(1);

const Base = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  wing: WingSchema,
  status: StatusSchema,
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const CardSchema = Base.extend({
  type: z.literal('card'),
  difficulty: Difficulty,
  front: NonEmpty,
  back: NonEmpty,
  explanation: z.string().optional(),
  /** Name of the sign/term, enabling "name the sign" reverse questions. */
  term: z.string().optional(),
  /** Ordered clues for Qui suis-je; defaults to description → system → meaning. */
  clues: z.array(NonEmpty).min(2).optional(),
  modes: z.array(PracticeModeSchema).min(1),
});

export const VisibleSignSchema = z.enum([
  'ictere',
  'paleur',
  'cyanose',
  'dyspnee',
  'toux',
  'oedemes-mi',
  'turgescence-jugulaire',
  'hippocratisme',
  'amaigrissement',
  'douleur-abdominale',
  'fievre',
  'exophtalmie',
  'ascite',
]);

const OptionsQuestion = {
  question: NonEmpty,
  options: z.array(NonEmpty).min(2),
  correct: z.array(z.number().int().min(0)).min(1),
  explanation: z.string().optional(),
};

const BonusQuestionSchema = z.object({ type: z.enum(['qcm-unique', 'qcm-multiple']), ...OptionsQuestion });

export const CaseSchema = Base.extend({
  type: z.literal('case'),
  difficulty: Difficulty,
  patient: z.object({
    name: NonEmpty,
    age: z.number().int().min(0).max(120),
    sex: z.enum(['M', 'F']),
    profession: z.string(),
    origin: z.string(),
    appearance: z.object({
      skinTone: z.number().int().min(1).max(6),
      hair: z.string(),
      beard: z.boolean().optional(),
      hijab: z.boolean().optional(),
      clothing: z.string(),
      visibleSigns: z.array(VisibleSignSchema).default([]),
    }),
    darija: z.string().optional(),
    darijaTranslation: z.string().optional(),
  }),
  chiefComplaint: NonEmpty,
  history: z
    .array(z.object({ q: NonEmpty, a: NonEmpty, key: z.boolean(), irrelevant: z.boolean().optional() }))
    .min(1),
  exam: z
    .array(
      z.object({
        zone: NonEmpty,
        tool: z.enum(TOOLS),
        finding: NonEmpty,
        key: z.boolean(),
        irrelevant: z.boolean().optional(),
      }),
    )
    .min(1),
  answer: z.object({
    syndrome: z.array(NonEmpty).min(1),
    etiology: z.string().optional(),
    acceptedSynonyms: z.array(z.string()).default([]),
    distractors: z.array(z.string()).default([]),
  }),
  bonusQuestion: BonusQuestionSchema.optional(),
  teaching: NonEmpty,
});

export const QcmSchema = Base.extend({
  type: z.enum(['qcm-unique', 'qcm-multiple']),
  ...OptionsQuestion,
  grading: z.string().optional(),
});

export const QrocSchema = Base.extend({
  type: z.literal('qroc'),
  question: NonEmpty,
  acceptedAnswers: z.array(NonEmpty).min(1),
  explanation: z.string().optional(),
});

const SubQuestionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['qcm-unique', 'qcm-multiple']), ...OptionsQuestion }),
  z.object({
    type: z.literal('qroc'),
    question: NonEmpty,
    acceptedAnswers: z.array(NonEmpty).min(1),
    explanation: z.string().optional(),
  }),
]);

export const CasCliniqueSchema = Base.extend({
  type: z.literal('cas-clinique'),
  vignette: NonEmpty,
  questions: z.array(SubQuestionSchema).min(1),
});

export const AssociationSchema = Base.extend({
  type: z.literal('association'),
  question: NonEmpty,
  pairs: z.array(z.object({ left: NonEmpty, right: NonEmpty })).min(2),
});

export const AuscultationSchema = Base.extend({
  type: z.literal('auscultation'),
  audioFile: NonEmpty,
  ...OptionsQuestion,
});

export const ImageQuestionSchema = Base.extend({
  type: z.literal('image'),
  imageFile: NonEmpty,
  ...OptionsQuestion,
});

export const ContentItemSchema = z.discriminatedUnion('type', [
  CardSchema,
  CaseSchema,
  QcmSchema,
  QrocSchema,
  CasCliniqueSchema,
  AssociationSchema,
  AuscultationSchema,
  ImageQuestionSchema,
]);

export const ContentFileSchema = z.array(ContentItemSchema);

export type Card = z.infer<typeof CardSchema>;
export type ClinicalCase = z.infer<typeof CaseSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type PracticeMode = z.infer<typeof PracticeModeSchema>;
export type ContentStatus = z.infer<typeof StatusSchema>;
