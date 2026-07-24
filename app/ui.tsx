"use client";
import { useState } from "react";

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
export function LinkBox({ label, value }: { label: string; value: string }) { const [copied, setCopied] = useState(false); return <div className="linkBox"><label>{label}</label><div><input readOnly value={value} /><button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); }}>{copied ? "Copiado!" : "Copiar"}</button></div></div>; }
