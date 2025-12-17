"use client";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}

export default function Layout({
  children,
  title,
  headerActions,
}: LayoutProps) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {headerActions}
      </div>
      {children}
    </div>
  );
}
