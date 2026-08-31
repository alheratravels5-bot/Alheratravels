import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import {
  FirebaseAppConfig,
  Candidate,
  JobVacancy,
  UmrahPackage,
  PartnerOffice,
  VisaBatch,
  IndividualVisa,
  PartnerOfficePayment,
  PartnerOfficeLedgerEntry,
  UmrahBooking,
  AgencyInfo
} from '../types';

// Provisioned Firebase Configuration for Al-Hera Travels
import firebaseAppletConfig from '../../firebase-applet-config.json';

const env = (import.meta as any).env || {};

export const DEFAULT_FIREBASE_CONFIG: FirebaseAppConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || "AIzaSyAWJgiDZugC_fhXvs9WXI4rp8JYzUMRgPE",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || "galvanic-pixel-2hh41.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "galvanic-pixel-2hh41",
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId || "ai-studio-alheratravels-ad1c677e-3915-4c6f-8930-725cc54c9700",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || "galvanic-pixel-2hh41.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || "449847533501",
  appId: env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || "1:449847533501:web:1a23283e235dddcdd47cd4"
};

const STORAGE_KEY_FIREBASE_CONFIG = 'al_hera_firebase_config';

export function getStoredFirebaseConfig(): FirebaseAppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error reading Firebase config from local storage', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveStoredFirebaseConfig(config: FirebaseAppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Firebase config', e);
  }
}

// Singletons
let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseAppInstance) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseAppInstance = getApp();
    } else {
      const config = getStoredFirebaseConfig();
      firebaseAppInstance = initializeApp(config);
    }
  }
  return firebaseAppInstance;
}

export function getFirebaseDb(): Firestore {
  if (!firestoreInstance) {
    const app = getFirebaseApp();
    const config = getStoredFirebaseConfig();
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      firestoreInstance = getFirestore(app, config.firestoreDatabaseId);
    } else {
      firestoreInstance = getFirestore(app);
    }
  }
  return firestoreInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
  }
  return authInstance;
}

// Connectivity test
export async function testFirebaseConnection(): Promise<{
  success: boolean;
  message: string;
  projectId?: string;
  collections?: {
    candidates: number;
    jobs: number;
    umrahPackages: number;
    partners: number;
  };
}> {
  try {
    const db = getFirebaseDb();
    const config = getStoredFirebaseConfig();

    // Ping candidates collection
    const candidateSnap = await getDocs(collection(db, 'candidates'));
    const jobsSnap = await getDocs(collection(db, 'jobs'));
    const packagesSnap = await getDocs(collection(db, 'umrah_packages'));
    const partnersSnap = await getDocs(collection(db, 'partners'));

    return {
      success: true,
      message: `Successfully connected to Firebase Project: ${config.projectId}`,
      projectId: config.projectId,
      collections: {
        candidates: candidateSnap.size,
        jobs: jobsSnap.size,
        umrahPackages: packagesSnap.size,
        partners: partnersSnap.size,
      },
    };
  } catch (error: any) {
    console.warn('Firebase connection test warning:', error);
    return {
      success: false,
      message: error?.message || 'Unable to establish live connection to Firebase.',
      projectId: DEFAULT_FIREBASE_CONFIG.projectId,
    };
  }
}

// Push all local data into Firebase Firestore
export async function pushAllToFirestore(payload: {
  candidates: Candidate[];
  jobs: JobVacancy[];
  packages: UmrahPackage[];
  partners: PartnerOffice[];
  visaBatches?: VisaBatch[];
  visas?: IndividualVisa[];
  partnerPayments?: PartnerOfficePayment[];
  partnerLedger?: PartnerOfficeLedgerEntry[];
  bookings?: UmrahBooking[];
  agencyInfo?: AgencyInfo;
}): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const db = getFirebaseDb();
    let totalCount = 0;

    // 1. Upload candidates
    if (payload.candidates && payload.candidates.length > 0) {
      const batch = writeBatch(db);
      for (const c of payload.candidates) {
        const ref = doc(db, 'candidates', c.id);
        batch.set(ref, {
          ...c,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 2. Upload jobs
    if (payload.jobs && payload.jobs.length > 0) {
      const batch = writeBatch(db);
      for (const j of payload.jobs) {
        const ref = doc(db, 'jobs', j.id);
        batch.set(ref, {
          ...j,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 3. Upload umrah packages
    if (payload.packages && payload.packages.length > 0) {
      const batch = writeBatch(db);
      for (const p of payload.packages) {
        const ref = doc(db, 'umrah_packages', p.id);
        batch.set(ref, {
          ...p,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 4. Upload partners
    if (payload.partners && payload.partners.length > 0) {
      const batch = writeBatch(db);
      for (const pt of payload.partners) {
        const ref = doc(db, 'partners', pt.id);
        batch.set(ref, {
          ...pt,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 5. Upload Visa Batches
    if (payload.visaBatches && payload.visaBatches.length > 0) {
      const batch = writeBatch(db);
      for (const vb of payload.visaBatches) {
        const ref = doc(db, 'visa_batches', vb.id);
        batch.set(ref, {
          ...vb,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 6. Upload Individual Visas
    if (payload.visas && payload.visas.length > 0) {
      const batch = writeBatch(db);
      for (const v of payload.visas) {
        const ref = doc(db, 'visas', v.id);
        batch.set(ref, {
          ...v,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 7. Upload Partner Payments
    if (payload.partnerPayments && payload.partnerPayments.length > 0) {
      const batch = writeBatch(db);
      for (const pop of payload.partnerPayments) {
        const ref = doc(db, 'partner_payments', pop.id);
        batch.set(ref, {
          ...pop,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 8. Upload Partner Ledger
    if (payload.partnerLedger && payload.partnerLedger.length > 0) {
      const batch = writeBatch(db);
      for (const tx of payload.partnerLedger) {
        const ref = doc(db, 'partner_ledger', tx.id);
        batch.set(ref, {
          ...tx,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        totalCount++;
      }
      await batch.commit();
    }

    // 9. Upload Agency Info
    if (payload.agencyInfo) {
      const ref = doc(db, 'settings', 'agency_info');
      await setDoc(ref, {
        ...payload.agencyInfo,
        _syncedAt: new Date().toISOString(),
      }, { merge: true });
      totalCount++;
    }

    return {
      success: true,
      message: `Successfully synchronized ${totalCount} records to Firebase Firestore!`,
      count: totalCount,
    };
  } catch (error: any) {
    console.error('Error pushing data to Firestore:', error);
    return {
      success: false,
      message: error?.message || 'Error occurred while saving to Firestore.',
      count: 0,
    };
  }
}

// Pull all data from Firebase Firestore into local memory/storage format
export async function pullAllFromFirestore(): Promise<{
  success: boolean;
  message: string;
  data?: {
    candidates: Candidate[];
    jobs: JobVacancy[];
    packages: UmrahPackage[];
    partners: PartnerOffice[];
    visaBatches?: VisaBatch[];
    visas?: IndividualVisa[];
    partnerPayments?: PartnerOfficePayment[];
    partnerLedger?: PartnerOfficeLedgerEntry[];
    agencyInfo?: AgencyInfo;
  };
}> {
  try {
    const db = getFirebaseDb();

    // Pull candidates
    const candSnap = await getDocs(collection(db, 'candidates'));
    const candidates: Candidate[] = [];
    candSnap.forEach((docSnap) => {
      candidates.push(docSnap.data() as Candidate);
    });

    // Pull jobs
    const jobSnap = await getDocs(collection(db, 'jobs'));
    const jobs: JobVacancy[] = [];
    jobSnap.forEach((docSnap) => {
      jobs.push(docSnap.data() as JobVacancy);
    });

    // Pull Umrah Packages
    const pkgSnap = await getDocs(collection(db, 'umrah_packages'));
    const packages: UmrahPackage[] = [];
    pkgSnap.forEach((docSnap) => {
      packages.push(docSnap.data() as UmrahPackage);
    });

    // Pull Partners
    const partnerSnap = await getDocs(collection(db, 'partners'));
    const partners: PartnerOffice[] = [];
    partnerSnap.forEach((docSnap) => {
      partners.push(docSnap.data() as PartnerOffice);
    });

    // Pull Visa Batches
    const batchSnap = await getDocs(collection(db, 'visa_batches'));
    const visaBatches: VisaBatch[] = [];
    batchSnap.forEach((docSnap) => {
      visaBatches.push(docSnap.data() as VisaBatch);
    });

    // Pull Visas
    const visaSnap = await getDocs(collection(db, 'visas'));
    const visas: IndividualVisa[] = [];
    visaSnap.forEach((docSnap) => {
      visas.push(docSnap.data() as IndividualVisa);
    });

    // Pull Partner Payments
    const paySnap = await getDocs(collection(db, 'partner_payments'));
    const partnerPayments: PartnerOfficePayment[] = [];
    paySnap.forEach((docSnap) => {
      partnerPayments.push(docSnap.data() as PartnerOfficePayment);
    });

    // Pull Partner Ledger
    const ledgerSnap = await getDocs(collection(db, 'partner_ledger'));
    const partnerLedger: PartnerOfficeLedgerEntry[] = [];
    ledgerSnap.forEach((docSnap) => {
      partnerLedger.push(docSnap.data() as PartnerOfficeLedgerEntry);
    });

    // Pull Agency Info
    const infoDoc = await getDoc(doc(db, 'settings', 'agency_info'));
    const agencyInfo = infoDoc.exists() ? (infoDoc.data() as AgencyInfo) : undefined;

    return {
      success: true,
      message: `Pulled data from Firestore: ${candidates.length} candidates, ${jobs.length} jobs, ${packages.length} packages, ${partners.length} partners, ${visas.length} visas.`,
      data: {
        candidates,
        jobs,
        packages,
        partners,
        visaBatches,
        visas,
        partnerPayments,
        partnerLedger,
        agencyInfo,
      },
    };
  } catch (error: any) {
    console.error('Error pulling from Firestore:', error);
    return {
      success: false,
      message: error?.message || 'Failed to read data from Firebase Firestore.',
    };
  }
}

// Single item CRUD operations helpers
export async function saveVisaBatchToFirestore(batch: VisaBatch): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'visa_batches', batch.id), {
      ...batch,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore visa batch save error:', err);
  }
}

export async function saveVisaToFirestore(visa: IndividualVisa): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'visas', visa.id), {
      ...visa,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore visa save error:', err);
  }
}

export async function savePartnerPaymentToFirestore(payment: PartnerOfficePayment): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'partner_payments', payment.id), {
      ...payment,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore partner payment save error:', err);
  }
}

export async function savePartnerLedgerToFirestore(entry: PartnerOfficeLedgerEntry): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'partner_ledger', entry.id), {
      ...entry,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore partner ledger save error:', err);
  }
}

// Single item CRUD operations helpers
export async function saveCandidateToFirestore(candidate: Candidate): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'candidates', candidate.id), {
      ...candidate,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore candidate save error (will keep in localStorage):', err);
  }
}

export async function deleteCandidateFromFirestore(candidateId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'candidates', candidateId));
  } catch (err) {
    console.warn('Firestore candidate delete error:', err);
  }
}

export async function saveJobToFirestore(job: JobVacancy): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'jobs', job.id), {
      ...job,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore job save error:', err);
  }
}

export async function deleteJobFromFirestore(jobId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'jobs', jobId));
  } catch (err) {
    console.warn('Firestore job delete error:', err);
  }
}

export async function savePackageToFirestore(pkg: UmrahPackage): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'umrah_packages', pkg.id), {
      ...pkg,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore package save error:', err);
  }
}

export async function deletePackageFromFirestore(pkgId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'umrah_packages', pkgId));
  } catch (err) {
    console.warn('Firestore package delete error:', err);
  }
}

export async function savePartnerToFirestore(partner: PartnerOffice): Promise<void> {
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'partners', partner.id), {
      ...partner,
      _syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore partner save error:', err);
  }
}

export async function deletePartnerFromFirestore(partnerId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'partners', partnerId));
  } catch (err) {
    console.warn('Firestore partner delete error:', err);
  }
}
