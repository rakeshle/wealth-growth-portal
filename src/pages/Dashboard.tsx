import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserLayout } from "@/components/UserLayout";
import { useAuth } from "@/context/AuthContext";
import { useInvestment } from "@/context/InvestmentContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { TransactionsList } from "@/components/TransactionsList";
import { Transaction, Investment } from "@/types";
import { ActiveInvestmentCard } from "@/components/ActiveInvestmentCard";
import { useHomeContent } from "@/hooks/useHomeContent";
import { PromotionsSection } from "@/components/home/PromotionsSection";
import { OffersSection } from "@/components/home/OffersSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import {
  Wallet,
  ArrowDown,
  ArrowUp,
  BarChart2,
  TrendingUp,
  Gift,
  ArrowRight,
  CircleDollarSign,
} from "lucide-react";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { products, userInvestments, transactions, isLoading: investmentLoading } = useInvestment();
  const { promotions, offers, features, isLoading: contentLoading, useMockData } = useHomeContent();
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const sorted = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentTransactions(sorted);
    }
  }, [transactions]);

  if (authLoading || investmentLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
    </div>;
  }

  const activeInvestments = userInvestments?.filter(inv => inv.status === 'active') || [];
  console.log("Active Investments:", activeInvestments);
  // Calculate total invested amount
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Calculate current investment value
  const currentInvestmentValue = activeInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
  console.log("Current Investment Value:", currentInvestmentValue);
  // Calculate profit/loss
  const profitLoss = currentInvestmentValue - totalInvested;
  const profitLossPercentage = totalInvested > 0 
    ? ((profitLoss / totalInvested) * 100).toFixed(2) 
    : '0.00';

  return (
    <UserLayout>
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your investment portfolio and account activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Available Balance"
            value={`$${Number(user.balance || 0).toFixed(2)}`}
            description="cannot be withdrawn before investing, invest now!"
            icon={<Wallet className="h-5 w-5 text-primary" />}
            onAction={() => navigate("/transactions")}
          />
          <StatCard
            title="Total Invested"
            value={`$${Number(user.totalInvested || 0).toFixed(2)}`}
            description={`${activeInvestments.length} active investments`
            }
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            onAction={() => navigate("/investments")}
          />
          <StatCard
            title="Total Withdrawn"
            value={`$${Number(user.totalWithdrawn || 0).toFixed(2)}`}
            description="All time"
            icon={<ArrowDown className="h-5 w-5 text-red-600" />}
          />
          <StatCard
            title="Referral Bonus"
            value={`$${Number(user.referralBonus || 0).toFixed(2)}`}
            description="From referrals"
            icon={<Gift className="h-5 w-5 text-purple-600" />}
            onAction={() => navigate("/referrals")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Investment Portfolio
              </CardTitle>
              <CardDescription>
                Your current investment performance and returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
  <div className="bg-muted px-4 py-3 rounded-lg flex-1">
    <div className="text-sm text-muted-foreground mb-1">Current Value</div>
    <div className="text-2xl font-bold">
      ${!isNaN(currentInvestmentValue) ? currentInvestmentValue.toFixed(2) : '0.00'}
    </div>
  </div>
  <div className="bg-muted px-4 py-3 rounded-lg flex-1">
    <div className="text-sm text-muted-foreground mb-1">Profit/Loss</div>
    <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {!isNaN(profitLoss) ? `${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}` : '0.00'} 
      ({Number(profitLossPercentage) >= 0 ? '+' : ''}{profitLossPercentage}%)
    </div>
  </div>
</div>

              {activeInvestments.length > 0 ? (
                <div className="space-y-4">
                  {activeInvestments.slice(0, 2).map(investment => {
                    const investmentProduct = products?.find(p => p.id === investment.product_id);

                    return (
                      <ActiveInvestmentCard 
                        key={investment.id}
                        investment={investment}
                        product={investmentProduct}
                      />
                    );
                  })}
                  {activeInvestments.length > 2 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={() => navigate("/investments")}
                    >
                      View All Investments ({activeInvestments.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <div className="mb-3 inline-flex p-3 bg-muted rounded-full">
                    <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No Active Investments</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start growing your wealth today</p>
                  <Button onClick={() => navigate("/investments")}>Explore Investment Plans</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" /> 
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest transactions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <TransactionsList transactions={recentTransactions} />
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/transactions")}
              >
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <ArrowUp className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Deposit Funds</h3>
              <p className="text-sm text-muted-foreground mb-4">Add money to invest in our plans</p>
              <Button onClick={() => navigate("/deposit")} variant="default" className="w-full">
                Make a Deposit
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Start Investing</h3>
              <p className="text-sm text-muted-foreground mb-4">Explore our investment plans</p>
              <Button onClick={() => navigate("/investments")} variant="default" className="w-full">
                View Plans
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Earn More</h3>
              <p className="text-sm text-muted-foreground mb-4">Refer friends and earn bonuses</p>
              <Button onClick={() => navigate("/referrals")} variant="default" className="w-full">
                Referral Program
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <PromotionsSection 
            promotions={promotions} 
            isLoading={contentLoading} 
            useMockData={useMockData} 
          />
          <OffersSection 
            offers={offers} 
            isLoading={contentLoading} 
            useMockData={useMockData} 
          />
          <FeaturesSection 
            features={features} 
            isLoading={contentLoading} 
            isAuthenticated={true}
            useMockData={useMockData} 
          />
        </div>
      </div>
    </UserLayout>
  );
};

export default Dashboard;
