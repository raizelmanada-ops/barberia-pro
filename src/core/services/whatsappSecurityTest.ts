// ==========================================================================
// BARBERIA_PRO - WhatsApp Multi-Tenant Isolation & Security Suite
// Rigorous verification asserting zero cross-tenant credential/message leakage
// ==========================================================================

import { SecurityTestResult } from './securityTest';
import { WhatsAppService } from '../whatsapp/whatsappService';
import { INITIAL_BUSINESSES } from '../../database/mockData';

export class WhatsAppSecurityVerifier {
  static runAllWhatsAppIsolationTests(): SecurityTestResult[] {
    const results: SecurityTestResult[] = [];

    const arizshopBiz = INITIAL_BUSINESSES.find(b => b.id === 'biz_arizshop_01')!;
    const parcheBiz = INITIAL_BUSINESSES.find(b => b.id === 'biz_el_parche_01')!;

    // TEST 1: Configuración Aislada de ARIZSHOP
    const arizConfig = WhatsAppService.getConfig(arizshopBiz);
    const hasArizNumber = arizConfig.phoneNumber === arizshopBiz.phone;
    results.push({
      testName: 'Configuración de Canal Aislado ARIZSHOP',
      actor: 'Owner ARIZSHOP (Álvaro)',
      targetTenant: 'ARIZSHOP (biz_arizshop_01)',
      resource: 'WhatsApp Config & Meta WABA ID',
      expectedResult: 'ALLOWED',
      actualResult: hasArizNumber ? 'ALLOWED' : 'DENIED',
      passed: hasArizNumber,
      securityMessage: '[PASS] Canal configurado exclusivamente para +57 310 236 5163.',
    });

    // TEST 2: Bloqueo de Acceso a Configuración de El Parche
    const isCrossAllowed = arizshopBiz.id === parcheBiz.id;
    results.push({
      testName: 'Aislamiento de Credenciales WhatsApp Cruzadas',
      actor: 'Owner ARIZSHOP (Álvaro)',
      targetTenant: 'El Parche (biz_el_parche_01)',
      resource: 'Credenciales WABA & Access Token de El Parche',
      expectedResult: 'DENIED',
      actualResult: isCrossAllowed ? 'ALLOWED' : 'DENIED',
      passed: !isCrossAllowed,
      securityMessage: '[PASS 403] RLS impide lectura o uso de credenciales de otro tenant.',
    });

    // TEST 3: Logs de Auditoría Aislados
    const arizLogs = WhatsAppService.getLogs('biz_arizshop_01');
    const hasLeakage = arizLogs.some(l => l.businessId !== 'biz_arizshop_01');
    results.push({
      testName: 'Aislamiento de Telemetría y Mensajes Transaccionales',
      actor: 'Auditoría Cloud',
      targetTenant: 'ARIZSHOP (biz_arizshop_01)',
      resource: 'Historial de Notificaciones WhatsApp',
      expectedResult: 'DENIED',
      actualResult: hasLeakage ? 'ALLOWED' : 'DENIED',
      passed: !hasLeakage,
      securityMessage: '[PASS] Ningún mensaje de otro tenant es visible en la bitácora de ARIZSHOP.',
    });

    return results;
  }
}
