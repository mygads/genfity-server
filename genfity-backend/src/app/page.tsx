import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect ke locale default (en)
  redirect('/en');
}