

import React from 'react';

// Defined a reusable type for icon components to accept a style prop.
type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const WavingHandIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25c0-2.28 1.5-4.5 3.75-4.5s3.75 2.22 3.75 4.5c0 1.99-1.03 3.75-2.5 4.5h-2.5c-1.47-.75-2.5-2.51-2.5-4.5zM16.5 8.25c0-2.28 1.5-4.5 3.75-4.5s3.75 2.22 3.75 4.5c0 1.99-1.03 3.75-2.5 4.5h-2.5c-1.47-.75-2.5-2.51-2.5-4.5zM3.75 8.25c0-2.28 1.5-4.5 3.75-4.5S11.25 6 11.25 8.25V15c0 2.25-1.5 4.5-3.75 4.5S3.75 17.25 3.75 15V8.25z" /></svg>
);

export const UserIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 9.34a4.002 4.002 0 01-5.658 5.658" /></svg>
);

export const HealthIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
);

export const FinanceIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0H21m-9 12h5.25m-5.25 0h-7.5" /></svg>
);

export const EducationIcon: React.FC<IconProps> = ({ className, style }) => (
 <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
);

export const HabitsIcon: React.FC<IconProps> = ({ className, style }) => (
 <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
);

export const WaterDropIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016 13.5a8.25 8.25 0 016.362-8.286z" /></svg>
);

export const ReadingIcon: React.FC<IconProps> = ({ className, style }) => <EducationIcon className={className} style={style} />;

export const WalkingIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
);

export const MeditationIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-5.63-4.29-10.38-9.75-10.485A9.75 9.75 0 004.5 12H1" /></svg>
);

export const MoneyIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0H21m-9 12h5.25m-5.25 0h-7.5" /></svg>
);

export const BellIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

export const MinusCircleIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 01-4.5-1.283V12.375c0-1.23.633-2.35 1.66-3.013l4.5-3.001a1.5 1.5 0 011.68 0l4.5 3.001c1.027.663 1.66 1.783 1.66 3.013v5.109A9.75 9.75 0 0116.5 18.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21a2.25 2.25 0 01-2.25-2.25V18h4.5v.75A2.25 2.25 0 019.75 21z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5h-3.75a.75.75 0 01-.75-.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5v-3m18 3v-3" /></svg>
  );
  
export const FlagIcon: React.FC<IconProps> = ({ className, style }) => (
<svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21v-18a.75.75 0 01.75-.75h14.25a.75.75 0 01.75.75v7.5m-15.75 0h15.75" /></svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className, style }) => (
<svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25V7.5a2.25 2.25 0 00-2.25-2.25h-3.75a2.25 2.25 0 00-2.25 2.25v1.5m0-1.5a2.25 2.25 0 00-2.25-2.25H7.5A2.25 2.25 0 005.25 7.5v6.75m15 0v2.25a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-2.25m15 0A2.25 2.25 0 0018.75 12H5.25a2.25 2.25 0 00-1.5 2.25m15 0c0 .621-.504 1.125-1.125 1.125H6.375c-.621 0-1.125-.504-1.125-1.125m13.5 0c0-1.036-.84-1.875-1.875-1.875H6.375c-1.036 0-1.875.84-1.875 1.875m13.5 0c0-1.036-.84-1.875-1.875-1.875H6.375c-1.036 0-1.875.84-1.875 1.875" /></svg>
);


export const BatteryIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.211a3.737 3.737 0 012.368 1.133 3.737 3.737 0 011.133 2.368V14.25a3.75 3.75 0 01-3.75 3.75h-1.5a3.75 3.75 0 01-3.75-3.75V6.462a3.737 3.737 0 011.133-2.368A3.737 3.737 0 018.5 2.961V2.75A.75.75 0 0110 2zM8.5 6.462a2.237 2.237 0 00-1.042 2.054V14.25a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25V8.516a2.237 2.237 0 00-1.042-2.054A2.253 2.253 0 0010 4.25c-.832 0-1.594.453-2.008.878A2.237 2.237 0 006.958 6.462z" clipRule="evenodd" /></svg>
);

export const WifiIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M1.343 5.343a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zm3.586 3.586a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zm3.586 3.586a.75.75 0 011.06 0l2.5 2.5a.75.75 0 11-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06zM18.657 5.343a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 01-1.06-1.06l2.5-2.5a.75.75 0 011.06 0zm-3.586 3.586a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l2.5-2.5a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);

export const CogIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0h15M12 4.5v.75m0 13.5v.75m-6.75-12.375L5.25 6m13.5 0L18.75 5.25M5.25 18l.75.75m12-1.5l-.75.75M12 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
);

export const PencilIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 19.82a2.25 2.25 0 01-1.897 1.13l-2.685.8.8-2.685a2.25 2.25 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125m-1.5-1.5l-3.238-3.238" /></svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09c-1.18 0-2.09.954-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 13.5z" /></svg>
);

export const MicrophoneIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 5.25v-1.5a6 6 0 00-12 0v1.5m6 6.75a.75.75 0 00.75-.75V11.25a.75.75 0 00-1.5 0v6.75a.75.75 0 00.75.75z" /></svg>
);

export const StopIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.253 9.253 9 9.563 9h4.874c.31 0 .563.253.563.563v4.874c0 .31-.253.563-.563.563H9.563C9.253 15 9 14.747 9 14.437V9.563z" /></svg>
);

export const DocumentScannerIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" /></svg>
);

export const ImageEditIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l2.36-2.36a.75.75 0 011.06 0l2.36 2.36m-4.72-4.72l-.884-.884a.75.75 0 10-1.06 1.06l.884.884m-1.06-1.06l-2.36 2.36a.75.75 0 000 1.06l2.36 2.36m4.72-4.72l-2.36 2.36" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

export const SpeakerWaveIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 11.233a.75.75 0 11-1.23-1.026 8.25 8.25 0 00-14.768 0 .75.75 0 11-1.23 1.026 9.75 9.75 0 0117.228 0zM12 18a.75.75 0 01.75-.75h.008a.75.75 0 010 1.5H12.75A.75.75 0 0112 18z" /></svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

export const DocumentChartBarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 17.25H14.75M9.25 13.5H14.75M7.5 5.25v13.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25V5.25M15 3.75h.75a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25-2.25h-7.5a2.25 2.25 0 01-2.25-2.25V6a2.25 2.25 0 012.25-2.25h.75m6 0v-1.5a1.5 1.5 0 00-1.5-1.5H10.5a1.5 1.5 0 00-1.5 1.5v1.5m6 0h-6" />
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.04.39.074.588.1a2.25 2.25 0 014.283 0 2.25 2.25 0 01-.165 3.823M12 18a2.25 2.25 0 00.165-3.823m0 3.823c-.195-.04-.39-.074-.588-.1a2.25 2.25 0 01-4.283 0 2.25 2.25 0 01.165-3.823m12.283-8.433a2.25 2.25 0 00-3.182-3.182 2.25 2.25 0 00-3.182 3.182m3.182-3.182l-3.182 3.182m0 0a2.25 2.25 0 003.182 3.182m-3.182-3.182a2.25 2.25 0 00-3.182 3.182" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
  </svg>
);

export const ArrowPathIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l4.992-4.993m-4.993 0l-3.181 3.183a8.25 8.25 0 000 11.664l3.181 3.183" />
  </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

export const LightBulbIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.994 14.994 0 01-4.5 0M9.75 10.5a8.25 8.25 0 114.5 0c0 1.913.623 3.68 1.683 5.163m-7.366-5.163a8.25 8.25 0 004.5 0m-4.5 0c-.351.458-.674.944-1.002 1.453M14.25 10.5c.328-.509.651-.995.972-1.453" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.215-.662 1.536 0l1.68 3.452a1 1 0 00.95.69h3.626c.726 0 1.033 1.026.498 1.488l-2.928 2.13a1 1 0 00-.364 1.118l1.108 3.593c.21 1.02-.823 1.848-1.642 1.29l-3.23-2.348a1 1 0 00-1.175 0l-3.23 2.348c-.82.558-1.852-.27-1.642-1.29l1.108-3.593a1 1 0 00-.364-1.118L1.732 8.514c-.535-.462-.228-1.488.498-1.488h3.626a1 1 0 00.95-.69l1.68-3.452z" clipRule="evenodd" />
  </svg>
);

export const FlameIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7.95 16.98a.75.75 0 01-1.06-1.06l1.05-1.05a2.502 2.502 0 00-3.38-3.55c-1.18.91-1.8 2.29-1.8 3.32 0 1.51 1.03 2.75 2.25 2.75a2.5 2.5 0 002.04-1.39z" />
    <path d="M13.5 10a3.5 3.5 0 10-5.71-2.82c-.08.16-.12.33-.12.52 0 .28.14.53.36.68l.001.001h.002c.03.02.06.04.09.06.27.16.59.27.94.27h.09a2.5 2.5 0 110-5 2.5 2.5 0 011.45.45c1.18.91 1.8 2.29 1.8 3.32 0 .44-.12.86-.33 1.23a.75.75 0 01-1.3-.78c.11-.2.18-.42.18-.65z" />
  </svg>
);

export const LevelUpIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
);

export const SunIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

export const CloudIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.666-5.412 5.25 5.25 0 00-9.833 2.155A4.5 4.5 0 002.25 15z" />
    </svg>
);

export const CloudRainIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.666-5.412 5.25 5.25 0 00-9.833 2.155A4.5 4.5 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75L9 20.25m3-1.5l.75 1.5m3-1.5l.75 1.5" />
    </svg>
);

export const EnvelopeIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25-2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
);

export const LeafIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 21a8.25 8.25 0 006.27-16.514.75.75 0 00-1.062-1.062A8.25 8.25 0 003 12.75a.75.75 0 001.5 0A6.75 6.75 0 0112.75 6c2.59 0 4.932 1.307 6.27 3.397a.75.75 0 001.18-.934A8.25 8.25 0 0012.75 3C7.22 3 3 7.22 3 12.75a.75.75 0 001.5 0c0-4.01 3.24-7.25 7.25-7.25s7.25 3.24 7.25 7.25a.75.75 0 001.5 0c0-4.83-3.92-8.75-8.75-8.75S3 7.92 3 12.75c0 4.25 3.03 7.78 7.002 8.568a.75.75 0 00.748-.75v-1.818a.75.75 0 00-.75-.75h-.002a6.75 6.75 0 01-5.228-3.078.75.75 0 00-1.282.79A8.25 8.25 0 0012.75 21z" /></svg>
);

export const MagnifyingGlassIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);

export const ChartPieIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);

export const ArrowUpCircleIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const ArrowDownCircleIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
);

export const ReceiptPercentIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h-1.5m-3 0h1.5m-1.5 0H3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export const JourneyIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-11.41-6.228 3.114a.75.75 0 0 0 0 1.362l6.228 3.114M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const FaceSmileIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4.06 4.06 0 01-5.656 0M9 10.5h.01M15 10.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const FaceMehIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5h.01M15 10.5h.01M9 15h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const FaceFrownIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 9.172a4.06 4.06 0 01-5.656 0M9 10.5h.01M15 10.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const RouteIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.036.218c-2.291 0-4.545-.16-6.75-.47m-13.5 0c-1.01.143-2.01.317-3 .52m3-.52L2.62 15.7a.996.996 0 00-.589-1.202 5.988 5.988 0 012.036-.218c2.291 0 4.545.16 6.75.47m0 0v-2.25" />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 13.5z" />
    </svg>
);

export const BenvisLogoIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path opacity="0.9" fillRule="evenodd" clipRule="evenodd" d="M18 16C18 18.2091 16.2091 20 14 20C11.7909 20 10 18.2091 10 16C10 13.7909 11.7909 12 14 12C16.2091 12 18 13.7909 18 16Z" fill="#3b82f6"/>
        <path d="M10 8C10 6.34315 11.3431 5 13 5H14C16.2091 5 18 6.79086 18 9V16C18 13.7909 16.2091 12 14 12H13C11.3431 12 10 10.6569 10 8Z" fill="#8b5cf6"/>
        <path d="M10 8C10 6.34315 11.3431 5 13 5H14C16.2091 5 18 6.79086 18 9V11H10V8Z" fill="#f43f5e"/>
    </svg>
);

export const customHabitIcons: { [key: string]: React.FC<IconProps> } = {
    WaterDrop: WaterDropIcon,
    Reading: ReadingIcon,
    BookOpen: BookOpenIcon,
    Walking: WalkingIcon,
    Meditation: MeditationIcon,
    MinusCircle: MinusCircleIcon,
    Flame: FlameIcon,
    Heart: HealthIcon,
    Bolt: BoltIcon,
    Leaf: LeafIcon,
    Star: StarIcon,
    Moon: MoonIcon,
    Sun: SunIcon,
    Sparkles: SparklesIcon,
    Brain: BrainIcon,
    Pencil: PencilIcon,
    Habits: HabitsIcon,
};

export const goalIcons: { [key: string]: React.FC<IconProps> } = {
    Target: TargetIcon,
    Health: HealthIcon,
    Finance: FinanceIcon,
    Education: EducationIcon,
    Trophy: TrophyIcon,
    Flag: FlagIcon,
    Briefcase: BriefcaseIcon,
    Habits: HabitsIcon,
    Money: MoneyIcon,
    Walking: WalkingIcon,
    Journey: JourneyIcon,
};