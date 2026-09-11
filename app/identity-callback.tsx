'use client';
import {useEffect} from 'react';
export default function IdentityCallback(){useEffect(()=>{const hash=new URLSearchParams(location.hash.slice(1));if(location.pathname!=='/admin'&&['invite_token','recovery_token','confirmation_token','access_token'].some(k=>hash.has(k)))location.replace('/admin'+location.hash)},[]);return null}
