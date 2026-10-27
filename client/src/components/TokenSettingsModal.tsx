"use client";

import React, { useEffect, useState } from "react";
import {
  Zap,
  Shield,
  Gauge,
  RotateCcw,
  PlusCircle,
  AlertTriangle,
  Check,
  Sparkles,
  CreditCard,
  Sliders,
  X,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function TokenSettingsModal() {
  const {
    tokens,
    user,
    pricingPlans,
    isTokenSettingsOpen,
    closeTokenSettings,
    updateDummySettings,
    refillTokens,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"workspace" | "usage" | "pricing">("workspace");
  const [sliderLimit, setSliderLimit] = useState<number>(tokens?.tokenLimit || 50000);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isTokenSettingsOpen) setActiveTab("workspace");
  }, [isTokenSettingsOpen]);

  if (!isTokenSettingsOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyCustomLimit = async () => {
    setIsUpdating(true);
    const ok = await updateDummySettings({ customLimit: sliderLimit });
    setIsUpdating(false);
    if (ok) showNotification(`Token limit updated to ${sliderLimit.toLocaleString()} tokens!`);
  };

  const handlePlanSwitch = async (planId: string) => {
    setIsUpdating(true);
    const plan = pricingPlans.find((p) => p.id === planId);
    const ok = await updateDummySettings({
      plan: planId,
      customLimit: plan?.monthlyTokens,
    });
    setIsUpdating(false);
    if (ok) {
      if (plan) setSliderLimit(plan.monthlyTokens);
      showNotification(`Switched dummy plan to ${planId.toUpperCase()}!`);
    }
  };

  const handleRefill = async (amount = 50000) => {
    setIsUpdating(true);
    const ok = await refillTokens(amount);
    setIsUpdating(false);
    if (ok) showNotification(`Refilled +${amount.toLocaleString()} tokens!`);
  };

  const handleSimulateExhaustion = async () => {
    setIsUpdating(true);
    const ok = await updateDummySettings({ simulateExhaustion: true });
    setIsUpdating(false);
    if (ok) showNotification("Simulated token exhaustion (0 tokens remaining). Try generating to see 429 block!");
  };

  const handleResetUsage = async () => {
    setIsUpdating(true);
    const ok = await updateDummySettings({ resetUsage: true });
    setIsUpdating(false);
    if (ok) showNotification("Reset token usage to 0!");
  };

  const currentLimit = tokens?.tokenLimit || 50000;
  const currentUsed = tokens?.tokensUsed || 0;
  const currentRemaining = tokens?.tokensRemaining || 0;
  const percentUsed = tokens?.percentUsed || 0;
  const currentPlan = tokens?.plan || "free";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-[#0c0c0e] shadow-2xl text-neutral-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Settings</h2>
              <p className="text-xs text-neutral-400">
                Workspace preferences, usage, and plan details.
              </p>
            </div>
          </div>
          <button
            onClick={closeTokenSettings}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-medium border-b-2 transition-all mr-6 cursor-pointer ${
              activeTab === "workspace"
                ? "border-emerald-400 text-emerald-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Workspace
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-medium border-b-2 transition-all mr-6 cursor-pointer ${
              activeTab === "usage"
                ? "border-emerald-400 text-emerald-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            Usage & Limits
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 pb-3 pt-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "pricing"
                ? "border-emerald-400 text-emerald-400 font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Plans
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="mx-6 mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            {notification}
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {activeTab === "usage" && <div className="rounded-xl border border-neutral-800 bg-[#121215] p-4.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Current Token Consumption</span>
              <span className="font-semibold text-white">
                {currentUsed.toLocaleString()} / {currentLimit.toLocaleString()}{" "}
                <span className="text-neutral-500">({percentUsed}%)</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  percentUsed > 90
                    ? "bg-red-500"
                    : percentUsed > 75
                    ? "bg-emerald-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Remaining:{" "}
                <strong className="text-white font-medium">
                  {currentRemaining.toLocaleString()} tokens
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                Tier:{" "}
                <strong className="text-emerald-300 uppercase tracking-wide">
                  {currentPlan}
                </strong>
                ({tokens?.planDetails?.rateLimitPerMin || 20} req/min)
              </span>
            </div>
          </div>}

          {activeTab === "workspace" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <p className="text-xs font-medium text-white">Appearance</p>
                <p className="mt-1 text-[11px] text-neutral-500">Dark workspace theme</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-neutral-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active
                </span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <p className="text-xs font-medium text-white">Project storage</p>
                <p className="mt-1 text-[11px] text-neutral-500">Projects save automatically in this browser.</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-neutral-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Auto-save on
                </span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <p className="text-xs font-medium text-white">Preview sizes</p>
                <p className="mt-1 text-[11px] text-neutral-500">Choose a responsive preview from the toolbar.</p>
                <span className="mt-3 inline-flex text-[10px] text-neutral-300">Desktop · Tablet · Mobile</span>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <p className="text-xs font-medium text-white">Account</p>
                <p className="mt-1 truncate text-[11px] text-neutral-500">{user?.email || "Guest session"}</p>
                <span className="mt-3 inline-flex text-[10px] capitalize text-neutral-300">{currentPlan} plan</span>
              </div>
            </div>
          ) : activeTab === "usage" ? (
            /* Usage and limits */
            <div className="space-y-6">
              {/* Plan Tier */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Choose a plan tier
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "free", label: "Free Explorer", tokens: "50k", rate: "20 req/m" },
                    { id: "pro", label: "Pro Builder", tokens: "500k", rate: "60 req/m" },
                    { id: "team", label: "Team / Scale", tokens: "2M", rate: "180 req/m" },
                  ].map((p) => {
                    const isSelected = currentPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePlanSwitch(p.id)}
                        disabled={isUpdating}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-500/60 bg-emerald-500/10 text-white shadow-sm"
                            : "border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                        }`}
                      >
                        <span className="text-xs font-semibold text-white flex items-center justify-between w-full">
                          {p.label}
                          {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium mt-1">
                          {p.tokens} tokens
                        </span>
                        <span className="text-[10px] text-neutral-500 mt-0.5">
                          {p.rate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Token Limit Slider */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                    Custom token limit
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    {sliderLimit.toLocaleString()} tokens
                  </span>
                </div>

                <input
                  type="range"
                  min={1000}
                  max={2000000}
                  step={5000}
                  value={sliderLimit}
                  onChange={(e) => setSliderLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />

                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>1,000 (Testing limit)</span>
                  <span>500,000 (Pro)</span>
                  <span>2,000,000 (Team)</span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustomLimit}
                  disabled={isUpdating}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  {isUpdating ? "Saving to Redis..." : "Apply custom limit"}
                </button>
              </div>

              {/* Quick Action Simulation Buttons */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Simulation & Dev Actions
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRefill(50000)}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium transition cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    +50,000 Tokens
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateExhaustion}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium transition cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Simulate 0 Tokens (429)
                  </button>

                  <button
                    type="button"
                    onClick={handleResetUsage}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Usage to 0
                  </button>
                </div>
              </div>

              {/* Rate Limiting Note */}
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/20 p-3 text-[11px] text-neutral-400 flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-200">
                    Sliding Window Redis Rate Limiter Active:
                  </span>{" "}
                  Your current plan enforces a maximum of{" "}
                  <strong className="text-white">
                    {tokens?.planDetails?.rateLimitPerMin || 20} requests/minute
                  </strong>
                  . If you exceed this rate or run out of tokens, the Express server responds with HTTP 429 Too Many Requests and rate limit headers.
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: PRICING & PLANS (PAYMENT LATER) */
            <div className="space-y-6">
              {/* Payment Later Banner */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-300 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Payment Integration Coming Soon!</span>
                  <p className="text-[11px] text-emerald-200/80 mt-0.5">
                    We will be adding Stripe and Paddle checkout later. In the meantime, you can freely switch to any plan or adjust token limits using the <strong>Usage &amp; Limits</strong> tab!
                  </p>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid md:grid-cols-3 gap-3.5">
                {pricingPlans
                  .filter((p) => p.id !== "guest")
                  .map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all ${
                          isCurrent
                            ? "border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-lg"
                            : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-white">
                              {plan.name}
                            </span>
                            {plan.badge && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {plan.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-1 my-3">
                            <span className="text-2xl font-bold text-white">
                              ${plan.priceMonthly}
                            </span>
                            <span className="text-[11px] text-neutral-500">/month</span>
                          </div>

                          <p className="text-[11px] text-neutral-400 mb-4 line-clamp-2">
                            {plan.description}
                          </p>

                          <div className="space-y-2 border-t border-neutral-800/80 pt-3">
                            {plan.features.map((feat, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-[11px] text-neutral-300"
                              >
                                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6">
                          {isCurrent ? (
                            <button
                              disabled
                              className="w-full py-2 rounded-xl bg-neutral-800 text-neutral-400 text-xs font-medium cursor-default"
                            >
                              Current Plan
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handlePlanSwitch(plan.id);
                                setActiveTab("usage");
                              }}
                              className="w-full py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition cursor-pointer shadow-sm active:scale-98"
                            >
                    Switch plan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-800 px-6 py-3 bg-[#0a0a0c] flex items-center justify-between text-xs text-neutral-500">
          <span>Settings are saved to your Kivo workspace.</span>
          <button
            onClick={closeTokenSettings}
            className="text-neutral-400 hover:text-white transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
