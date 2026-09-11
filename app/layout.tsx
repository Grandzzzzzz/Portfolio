import IdentityCallback from './identity-callback';
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'NOVA® — Independent Designer & Art Director', description:'A selection of identities, editorial experiments, and digital experiences. Personal portfolio concept.' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body><IdentityCallback/>{children}</body></html>}
