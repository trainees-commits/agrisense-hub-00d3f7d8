import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Lock, User } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>(user?.user_metadata?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const handleUpdateName = async () => {
    if (!fullName.trim()) { toast.error('Informe o nome'); return; }
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSavingName(false);
    if (error) toast.error(error.message); else toast.success('Nome atualizado com sucesso');
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Preencha todos os campos'); return; }
    if (newPassword.length < 6) { toast.error('A nova palavra-passe deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('As palavras-passe não coincidem'); return; }
    setSavingPwd(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });
    if (signInErr) { setSavingPwd(false); toast.error('Palavra-passe atual incorreta'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Palavra-passe alterada com sucesso');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gestão de segurança da conta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" /> Dados da Conta
            </CardTitle>
            <CardDescription className="text-xs">Atualize o seu nome de utilizador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Nome de utilizador</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" />
            </div>
            <Button onClick={handleUpdateName} disabled={savingName} className="w-full">
              {savingName && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Atualizar Nome
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" /> Alterar Palavra-passe
            </CardTitle>
            <CardDescription className="text-xs">Defina uma nova palavra-passe segura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Palavra-passe atual</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Nova palavra-passe</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Confirmar nova palavra-passe</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <Button onClick={handleUpdatePassword} disabled={savingPwd} className="w-full">
              {savingPwd && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Alterar Palavra-passe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
