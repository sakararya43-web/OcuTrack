import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ShieldAlert, Eye, Cpu, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { APP_NAME, NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';

export const TermsConditionsPage: React.FC = () => {
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
          <Scale className="w-3.5 h-3.5" aria-hidden="true" />
          Prototype Usage Terms
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          By accessing or operating the {APP_NAME} web interface, you acknowledge and agree to the
          clinical boundaries, safety protocols, and investigational limitations set forth below.
        </p>
      </div>

      <Alert
        variant="clinical"
        title="Mandatory Non-Diagnostic Device Notice"
        icon={<ShieldAlert className="w-5 h-5 text-slate-700" aria-hidden="true" />}
      >
        {NON_DIAGNOSTIC_DISCLAIMER}
      </Alert>

      <div className="space-y-5">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">1. Intended Research &amp; Screening-Support Scope</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {APP_NAME} is provided strictly as an investigational software prototype for
              quantitative ocular measurement collection, recording-quality inspection, and
              personal-baseline longitudinal monitoring. It is not cleared or approved by the FDA,
              CE, CDSCO, or any medical device regulatory body.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <ShieldAlert className="w-5 h-5 text-rose-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">2. Prohibited Clinical Uses</h2>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 pl-1">
              <li>Do not use {APP_NAME} to diagnose Parkinson&apos;s disease, concussion, diabetic neuropathy, or any neurological or ophthalmic disorder.</li>
              <li>Do not use automated measurements or model outputs to make unsupervised treatment decisions or emergency triage determinations.</li>
              <li>Do not interpret stable or unchanged longitudinal readings as proof that an individual is free of medical or neurological conditions.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <Eye className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">3. Participant Safety &amp; Illumination Protocol</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Operators must never direct high-intensity flashlights, camera torches, or laser
              sources directly into a participant&apos;s eyes. Follow the documented diffuse ambient
              lighting and on-screen light stimulus procedure. Discontinue testing immediately if a
              participant experiences ocular discomfort or light sensitivity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900">
              <Cpu className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-base font-semibold">4. Experimental Machine Learning Outputs</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Any Temporal Convolutional Network (TCN) or statistical sequence metrics displayed in
              assessment reports are experimental research indicators. They have not undergone
              clinical validation and are provided solely alongside raw feature values and quality
              checks for qualified clinician review.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">
              5. Operator Responsibility &amp; Warranty Disclaimer
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This prototype is provided &quot;as is&quot; without warranty of clinical accuracy,
              fitness for a particular medical purpose, or continuous availability. Operators are
              solely responsible for obtaining informed participant consent, maintaining pseudonymous
              records, and referring participants to licensed clinicians whenever clinically
              appropriate.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
        <Link to="/" className="text-slate-600 hover:text-slate-900 font-medium">
          Return to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-sky-800 hover:text-sky-900 font-medium hover:underline">
            Privacy Policy
          </Link>
          <Link to="/about" className="text-sky-800 hover:text-sky-900 font-medium hover:underline">
            Methodology &amp; Limitations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
