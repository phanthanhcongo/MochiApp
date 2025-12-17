interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Đang tải...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-500 border-r-amber-500"></div>
      {message && <p className="mt-6 text-lg font-medium text-gray-700">{message}</p>}
    </div>
  );
}

