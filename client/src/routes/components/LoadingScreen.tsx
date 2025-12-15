interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Đang tải...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-400 border-solid"></div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-4 border-b-4 border-yellow-200 opacity-50"></div>
      </div>
      <p className="mt-6 text-xl font-medium text-gray-800">{message}</p>
    </div>
  );
}

