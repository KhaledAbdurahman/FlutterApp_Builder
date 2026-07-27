import { describe, expect, it } from 'vitest';
import {
  CalculateLivePreviewScale,
  CreateLivePreviewProjectSignature,
  ResolveLivePreviewUrl,
} from '@/utils/live-preview-utils';

describe('live preview helpers', () => {
  it('uses the API host when the backend advertises a loopback preview URL', () => {
    expect(
      ResolveLivePreviewUrl(
        'http://localhost:8080',
        'http://192.168.1.20:8000/api/',
        'http://192.168.1.10:5173',
      ),
    ).toBe('http://192.168.1.20:8080/');
  });

  it('preserves a public preview host', () => {
    expect(
      ResolveLivePreviewUrl(
        'https://preview.example.com:8080',
        'https://api.example.com/api/',
        'https://builder.example.com',
      ),
    ).toBe('https://preview.example.com:8080/');
  });

  it('fits a phone into the available area without enlarging it', () => {
    expect(CalculateLivePreviewScale(800, 900, 410, 864)).toBe(1);
    expect(CalculateLivePreviewScale(300, 600, 410, 864)).toBeCloseTo(600 / 864);
  });

  it('includes both project identity and JSON in the generated artifact signature', () => {
    const projectJson = {
      app_name: 'store',
      package_name: 'com.example.store',
      screens: [],
    };

    expect(CreateLivePreviewProjectSignature('Store', projectJson)).not.toBe(
      CreateLivePreviewProjectSignature('Renamed Store', projectJson),
    );
  });
});
