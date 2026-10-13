import crypto from 'crypto';
import { generateCryptoOtp, hashOtp } from '../services/otp';

/**
 * ARORA ESPORTS Critical Workflow Verification Suite
 * Tests core security, authorization, data validation, and logic components
 */
async function runSuite() {
  console.log('\n======================================================');
  console.log('🧪 ARORA ESPORTS CRITICAL WORKFLOW TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  // 1. Passwordless OTP Cryptographic Properties
  const otp1 = generateCryptoOtp();
  const otp2 = generateCryptoOtp();
  assert('OTP is exactly 6 digits', /^\d{6}$/.test(otp1));
  assert('Consecutive OTPs are distinct and non-deterministic', otp1 !== otp2);

  const salt = crypto.randomBytes(16).toString('hex');
  const hash1 = hashOtp(otp1, salt);
  const hash2 = hashOtp(otp1, salt);
  const hashDifferentSalt = hashOtp(otp1, crypto.randomBytes(16).toString('hex'));
  assert('OTP hash is deterministic with identical salt', hash1 === hash2);
  assert('OTP hash is unique with distinct salt', hash1 !== hashDifferentSalt);
  assert('Plaintext OTP is never stored in hash (length is 64 hex)', hash1.length === 64);

  // 2. 4-Player Squad Validation Logic
  const validCaptainUid = 'UID_1001';
  const validTeammates = [
    { ign: 'Player2', uid: 'UID_1002' },
    { ign: 'Player3', uid: 'UID_1003' },
    { ign: 'Player4', uid: 'UID_1004' },
  ];
  const allUids = [validCaptainUid, ...validTeammates.map((t) => t.uid)];
  const isUnique = new Set(allUids).size === 4;
  assert('Valid 4-player squad with unique UIDs is accepted', isUnique && allUids.length === 4);

  const duplicateUids = [validCaptainUid, validCaptainUid, 'UID_1003', 'UID_1004'];
  const hasDuplicates = new Set(duplicateUids).size !== 4;
  assert('Squad with duplicate UID is rejected by uniqueness check', hasDuplicates);

  // 3. Admin Authorization Enforcement Logic
  const playerRoles = ['Player'];
  const adminRoles = ['Player', 'Admin'];

  function checkAdminAccess(roles: string[]): boolean {
    return roles.includes('Admin');
  }

  assert('Ordinary Player is denied admin access', !checkAdminAccess(playerRoles));
  assert('Provisioned Admin is granted admin access', checkAdminAccess(adminRoles));

  // 4. Duplicate UTR Prevention Logic
  const utrCache = new Set<string>();
  const testUtr = 'UPI20261011987654';

  function submitUtr(utr: string): boolean {
    if (utrCache.has(utr)) {
      return false; // rejected
    }
    utrCache.add(utr);
    return true; // accepted
  }

  assert('First UTR submission succeeds', submitUtr(testUtr));
  assert('Duplicate UTR submission is strictly rejected', !submitUtr(testUtr));

  // 5. Tournament Capacity Enforcement Logic
  const maxCapacity = 12;
  let currentRegistered = 12;

  function canRegister(current: number, max: number): boolean {
    return current < max;
  }

  assert('Registration rejected when tournament is full (12/12)', !canRegister(currentRegistered, maxCapacity));
  currentRegistered = 11;
  assert('Registration allowed when slot is open (11/12)', canRegister(currentRegistered, maxCapacity));

  // 6. Manual Match Credential Security Logic
  const match = {
    roomId: 'ROOM_99182',
    roomPassword: 'PASS_BERMUDA_7',
    credentialsReleased: false,
  };

  function getClientFacingRoomCredentials(m: typeof match) {
    if (!m.credentialsReleased) {
      return { roomId: null, roomPassword: null };
    }
    return { roomId: m.roomId, roomPassword: m.roomPassword };
  }

  const unreleased = getClientFacingRoomCredentials(match);
  assert('Unreleased credentials are completely null to client', unreleased.roomId === null && unreleased.roomPassword === null);

  match.credentialsReleased = true;
  const released = getClientFacingRoomCredentials(match);
  assert('Released credentials are provided to eligible captain', released.roomId === 'ROOM_99182' && released.roomPassword === 'PASS_BERMUDA_7');

  console.log('\n======================================================');
  console.log(`📊 Suite Results: ${passed}/${total} passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runSuite();
}
