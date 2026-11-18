import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck, Trash2, Database, UserCheck, ArrowLeft } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../lib/constants';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        <Badge variant="medical">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          Data Protection &amp; Privacy Architecture
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          This Privacy Policy describes how {APP_NAME} (protocol{' '}
          <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
            {PROTOCOL_VERSION}
          </code>
          ) collects, processes, and discards participant data during clinical screening-support
          demonstrations and longitudinal observation sessions.
        </p>
      </div>

      <div className="space-y-5">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <UserCheck className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">1. Pseudonymous Data Minimization</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {APP_NAME} is engineered to operate without direct personal health identifiers.
              Healthcare workers register participants using synthetic pseudonymous identifiers
              (such as <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">OT-0001</code>)
              and broad age bands. Real names, phone numbers, email addresses, government IDs, and
              exact dates of birth must not be entered into any field, including context notes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <ShieldCheck className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">2. Informed Consent Requirement</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Camera capture and backend assessment creation are gated on explicit consent
              confirmation. The operator must verify that the participant understands the guided
              pupil light reflex and smooth-pursuit video recording procedures, the non-diagnostic
              prototype status of the software, and how measurements are stored.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <Trash2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">3. Ephemeral Raw Video Handling</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Raw eye recordings uploaded for pupil-response and smooth-pursuit analysis are stored
              only in isolated temporary backend storage for the duration of computer-vision feature
              extraction. Temporary video files are deleted automatically once analysis completes or
              terminates. Raw recordings are not retained long-term by default and are never shared
              with third-party advertising, analytics, or external model-training services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <Database className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">4. Structured Measurement Storage &amp; Security</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Only structured metadata and derived quantitative features are persisted in the
              PostgreSQL database to support longitudinal personal-baseline comparison:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 pl-1">
              <li>Pseudonymous participant identifier, age band, consent status, and optional non-identifying context notes.</li>
              <li>Assessment timestamps, protocol version, device capability metadata, and illumination method notes.</li>
              <li>Extracted pupil and smooth-pursuit numerical measurements, quality indicators, and baseline comparison deltas.</li>
              <li>Database credentials and service-role secrets remain strictly server-side and are never exposed to browser clients.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">
              5. Participant Rights &amp; Prototype Notice
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Participants may decline or withdraw consent at any point prior to or following a
              session. Because this software is an investigational hackathon prototype, deployments
              must not store real production Protected Health Information (PHI) unless the hosting
              organization completes full regional regulatory, encryption, and compliance review.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
        <Link to="/" className="text-slate-600 hover:text-slate-900 font-medium">
          Return to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="text-sky-800 hover:text-sky-900 font-medium hover:underline">
            Terms and Conditions
          </Link>
          <Link to="/about" className="text-sky-800 hover:text-sky-900 font-medium hover:underline">
            Methodology &amp; Limitations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
