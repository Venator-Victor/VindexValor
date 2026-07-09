import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw as Loader2, Envelope as MailCheck } from '@/components/BxIcon';
import VindexLogo from '@/components/VindexLogo';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const { isRecoveryMode, resetPasswordForEmail, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await resetPasswordForEmail(email);
    setIsSubmitting(false);
    if (!error) {
      setLinkSent(true);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: t('auth.password_too_short_title'), description: t('auth.password_too_short_desc') });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: t('common.error'), description: t('auth.passwords_no_match') });
      return;
    }
    setIsSubmitting(true);
    const { error } = await updatePassword(newPassword);
    setIsSubmitting(false);
    if (!error) {
      toast({ title: t('auth.password_updated_title'), description: t('auth.password_updated_desc') });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-vindex-bg flex items-center justify-center p-4">
      <Helmet>
        <title>{t('auth.reset_title')} - VindexValor</title>
      </Helmet>

      <div className="w-full max-w-md bg-vindex-card rounded-xl border border-vindex-border shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <VindexLogo />
        </div>

        <h1 className="text-2xl font-bold text-center text-vindex-text mb-6">
          {isRecoveryMode ? t('auth.new_password_title') : t('auth.reset_title')}
        </h1>

        {isRecoveryMode ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-sm text-vindex-text/70 text-center mb-4">
              {t('auth.new_password_placeholder')}
            </p>
            <div>
              <Label htmlFor="newPassword">{t('auth.new_password_label')}</Label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text hover:border-primary focus:border-primary outline-none"
                required
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text hover:border-primary focus:border-primary outline-none"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-vindex-success hover:bg-vindex-success/90 text-white font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('auth.update_password')}
            </Button>
          </form>
        ) : linkSent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <MailCheck className="w-12 h-12 text-vindex-success" />
            <p className="text-vindex-text font-medium">{t('auth.link_sent_title')}</p>
            <p className="text-sm text-vindex-text/70">
              {t('auth.link_sent_desc', { email })}
            </p>
            <button
              type="button"
              onClick={() => setLinkSent(false)}
              className="text-xs text-vindex-success hover:underline mt-2"
            >
              {t('auth.resend_email')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestLink} className="space-y-4">
            <p className="text-sm text-vindex-text/70 text-center mb-4">
              {t('auth.request_link_placeholder')}
            </p>
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-vindex-bg border border-vindex-border rounded-lg text-vindex-text hover:border-primary focus:border-primary outline-none"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-vindex-success hover:bg-vindex-success/90 text-white font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('auth.send_link')}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-vindex-success hover:underline font-bold">
            {t('auth.back_to_login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
