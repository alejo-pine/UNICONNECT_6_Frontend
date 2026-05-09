import { API_BASE_URL } from '../../../config/api';

const ONBOARDING_STATUS_URL = `${API_BASE_URL}/onboarding/status`;
const ONBOARDING_COMPLETE_URL = `${API_BASE_URL}/onboarding/complete`;
const ONBOARDING_PROGRAMS_URL = `${API_BASE_URL}/onboarding/programs`;
const ONBOARDING_STEP_1_URL = `${API_BASE_URL}/onboarding/step-1`;
const ONBOARDING_STEP_1_CONTACT_URL = `${API_BASE_URL}/onboarding/step-1/contact`;

export interface OnboardingProgramOption {
  name: string;
}

export interface OnboardingStepOnePayload {
  career: string;
  semester: number;
  phoneNumber: string;
}

export interface OnboardingStepOneValidationErrors {
  career?: string;
  semester?: string;
  phone_number?: string;
}

interface BackendErrorPayload {
  message?: string;
  validationErrors?: OnboardingStepOneValidationErrors;
  validation_errors?: OnboardingStepOneValidationErrors;
  errors?: OnboardingStepOneValidationErrors;
  data?: BackendErrorPayload;
}

export class OnboardingApiError extends Error {
  status: number;
  validationErrors?: OnboardingStepOneValidationErrors;

  constructor(message: string, status: number, validationErrors?: OnboardingStepOneValidationErrors) {
    super(message);
    this.name = 'OnboardingApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

interface OnboardingStatusResponse {
  needsOnboarding: boolean;
}

function parseJsonBody(bodyText: string): unknown {
  if (!bodyText) {
    return {};
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return { message: bodyText };
  }
}

function extractValidationErrors(payload: unknown): OnboardingStepOneValidationErrors | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const source = payload as BackendErrorPayload;
  return source.validationErrors ?? source.validation_errors ?? source.errors ?? source.data?.validationErrors;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const source = payload as BackendErrorPayload;
  return source.message || source.data?.message || fallback;
}

interface OnboardingStatusCandidate {
  needsOnboarding?: boolean;
  needs_onboarding?: boolean;
  data?: OnboardingStatusCandidate;
  user?: OnboardingStatusCandidate;
  profile?: OnboardingStatusCandidate;
  result?: OnboardingStatusCandidate;
}

interface OnboardingProgramRecord {
  name?: string;
}

interface OnboardingProgramsCandidate {
  data?: OnboardingProgramRecord[];
  programs?: OnboardingProgramRecord[];
  result?: OnboardingProgramRecord[];
  results?: OnboardingProgramRecord[];
  subjects?: OnboardingProgramRecord[];
}

function extractPrograms(payload: unknown): OnboardingProgramRecord[] {
  if (Array.isArray(payload)) {
    return payload as OnboardingProgramRecord[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const source = payload as OnboardingProgramsCandidate;
  const candidates = [source.data, source.programs, source.result, source.results, source.subjects];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractNeedsOnboarding(payload: unknown): boolean | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload as OnboardingStatusCandidate;
  const candidates = [source, source.data, source.user, source.profile, source.result].filter(
    Boolean
  ) as OnboardingStatusCandidate[];

  for (const candidate of candidates) {
    const value = candidate.needsOnboarding ?? candidate.needs_onboarding;
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return null;
}

export async function getOnboardingStatus(token: string): Promise<OnboardingStatusResponse> {
  let response: Response;

  try {
    response = await fetch(ONBOARDING_STATUS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('No fue posible conectar con el servicio de onboarding.');
  }

  const bodyText = await response.text();

  if (!response.ok) {
    throw new OnboardingApiError(
      bodyText || `No fue posible obtener el estado de onboarding (${response.status}).`,
      response.status
    );
  }

  const parsedBody = parseJsonBody(bodyText);

  const needsOnboarding = extractNeedsOnboarding(parsedBody);

  if (needsOnboarding === null) {
    throw new Error('El backend no devolvió needsOnboarding como booleano.');
  }

  return { needsOnboarding };
}

export async function completeOnboarding(token: string, skipped: boolean): Promise<void> {
  let response: Response;

  try {
    response = await fetch(ONBOARDING_COMPLETE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skipped }),
    });
  } catch {
    throw new Error('No fue posible completar el onboarding por un problema de red.');
  }

  const bodyText = await response.text();

  if (!response.ok) {
    const parsedBody = parseJsonBody(bodyText);
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible completar el onboarding (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }
}

export async function getOnboardingPrograms(
  token: string,
  search = '',
  limit = 20
): Promise<OnboardingProgramOption[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const query = new URLSearchParams();
  query.append('limit', String(safeLimit));
  if (search.trim()) {
    query.append('search', search.trim());
  }

  const requestUrl = `${ONBOARDING_PROGRAMS_URL}?${query.toString()}`;

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('No fue posible cargar la lista de carreras.');
  }

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible consultar programas (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }

  const data = extractPrograms(parsedBody);

  return data
    .map((item) => ({ name: item?.name?.trim() || '' }))
    .filter((item) => item.name.length > 0);
}

export async function autosaveOnboardingContact(token: string, phoneNumber: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(ONBOARDING_STEP_1_CONTACT_URL, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  } catch {
    throw new Error('No fue posible guardar el contacto en este momento.');
  }

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible guardar contacto (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }
}

export async function submitOnboardingStepOne(
  token: string,
  payload: OnboardingStepOnePayload
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(ONBOARDING_STEP_1_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        career: payload.career,
        semester: payload.semester,
        phone_number: payload.phoneNumber,
      }),
    });
  } catch {
    throw new Error('No fue posible guardar el paso 1 del onboarding.');
  }

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible guardar el paso 1 (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }
}
