
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, WithdrawalStats } from '@/types';
import { toast } from 'sonner';

export function useWithdrawalStats(user: User | null) {
  const [stats, setStats] = useState<WithdrawalStats>({
    availableWithdrawal: 0,
    profitAmount: 0,
    referralBonus: 0,
    pendingWithdrawals: 0,
    escrowedAmount: 0,
    totalWithdrawn: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get user's current profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, total_invested, referral_bonus, escrowed_amount, total_withdrawn')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Get pending withdrawals
      const { data: pendingWithdrawals, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (withdrawalsError) {
        throw withdrawalsError;
      }

      const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      // Calculate profit amount: current balance minus total invested
      // This represents the actual profit earned from investments
      const profitAmount = Math.max(0, (profile.balance || 0) - (profile.total_invested || 0));
      
      // Available withdrawal is profit + referral bonus minus escrowed amount
      const availableWithdrawal = profitAmount + (profile.referral_bonus || 0) - (profile.escrowed_amount || 0);

      console.log('Withdrawal stats calculation:', {
        balance: profile.balance,
        totalInvested: profile.total_invested,
        calculatedProfit: profitAmount,
        referralBonus: profile.referral_bonus,
        escrowedAmount: profile.escrowed_amount,
        availableWithdrawal
      });

      setStats({
        availableWithdrawal: Math.max(0, availableWithdrawal),
        profitAmount: profitAmount,
        referralBonus: profile.referral_bonus || 0,
        pendingWithdrawals: pendingAmount,
        escrowedAmount: profile.escrowed_amount || 0,
        totalWithdrawn: profile.total_withdrawn || 0,
      });
    } catch (error: any) {
      console.error('Error fetching withdrawal stats:', error.message);
      toast.error('Failed to load withdrawal statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (user) {
      const channel = supabase
        .channel('withdrawal-stats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'withdrawal_requests',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchStats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, WithdrawalStats } from '@/types';
import { toast } from 'sonner';

export function useWithdrawalStats(user: User | null) {
  const [stats, setStats] = useState<WithdrawalStats>({
    availableWithdrawal: 0,
    profitAmount: 0,
    referralBonus: 0,
    pendingWithdrawals: 0,
    escrowedAmount: 0,
    totalWithdrawn: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, total_invested, referral_bonus, escrowed_amount, total_withdrawn')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: pendingWithdrawals, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (withdrawalsError) throw withdrawalsError;

      const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
      const profitAmount = Math.max(0, (profile.balance || 0) - (profile.total_invested || 0));
      const availableWithdrawal = profitAmount + (profile.referral_bonus || 0) - (profile.escrowed_amount || 0);

      setStats({
        availableWithdrawal: Math.max(0, availableWithdrawal),
        profitAmount: profitAmount,
        referralBonus: profile.referral_bonus || 0,
        pendingWithdrawals: pendingAmount,
        escrowedAmount: profile.escrowed_amount || 0,
        totalWithdrawn: profile.total_withdrawn || 0,
      });
    } catch (error: any) {
      console.error('Error fetching withdrawal stats:', error.message);
      toast.error('Failed to load withdrawal statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async () => {
    if (!user) return;
    if (stats.availableWithdrawal <= 0) {
      toast.error('No available balance to withdraw');
      return;
    }

    try {
      setIsWithdrawing(true);

      const { error } = await supabase.from('withdrawal_requests').insert([
        {
          user_id: user.id,
          amount: stats.availableWithdrawal,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast.success('Withdrawal request submitted');
      fetchStats();
    } catch (error: any) {
      console.error('Withdrawal error:', error.message);
      toast.error('Failed to submit withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (user) {
      const channel = supabase
        .channel('withdrawal-stats-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'withdrawal_requests',
            filter: `user_id=eq.${user.id}`,
          },
          fetchStats
        )
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          fetchStats
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    stats,
    isLoading,
    isWithdrawing,
    refetch: fetchStats,
    withdraw,
  };
}
