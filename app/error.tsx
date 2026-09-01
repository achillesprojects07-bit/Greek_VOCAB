"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding:24, background:"#fff", fontFamily:"Arial,sans-serif" }}><section style={{ maxWidth:520, border:"1px solid #d9e4ee", borderRadius:18, padding:32, textAlign:"center" }}><div style={{ color:"#1769aa", fontSize:12, fontWeight:800, letterSpacing:".12em" }}>YOUR PROGRESS IS SAFE</div><h1 style={{ color:"#123b66", fontSize:30 }}>This screen could not be loaded.</h1><p style={{ color:"#526170", lineHeight:1.6 }}>Nothing has been marked complete. Try reopening the screen.</p><button onClick={reset} style={{ border:0, borderRadius:11, padding:"13px 20px", background:"#1769aa", color:"#fff", fontWeight:800, cursor:"pointer" }}>Try again</button></section></main>;
}
