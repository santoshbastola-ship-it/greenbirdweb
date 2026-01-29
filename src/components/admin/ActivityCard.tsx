import { FarmActivity } from "@/types/extra";
import { format } from "date-fns";
import { Calendar, Trash2, Eye, EyeOff, Image as ImageIcon, Video } from "lucide-react";

interface ActivityCardProps {
    activity: FarmActivity;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export default function ActivityCard({ activity, onDelete, onToggleStatus }: ActivityCardProps) {
    const mediaCount = activity.media?.length || 0;
    const videoCount = activity.media?.filter(m => m.type === 'video').length || 0;
    const imageCount = mediaCount - videoCount;

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow ${!activity.isPublished ? 'opacity-75' : ''}`}>
            <div className="flex items-start gap-4">
                {/* Left: Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                    <img
                        src={activity.imageUrl}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                    />
                    {!activity.isPublished && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-gray-900/60 px-1.5 py-0.5 rounded">Draft</span>
                        </div>
                    )}
                    <div className="absolute bottom-1 right-1 flex gap-1">
                        {imageCount > 0 && (
                            <div className="bg-black/60 text-white text-[10px] px-1 rounded flex items-center gap-0.5">
                                <ImageIcon className="h-2.5 w-2.5" /> {imageCount}
                            </div>
                        )}
                        {videoCount > 0 && (
                            <div className="bg-black/60 text-white text-[10px] px-1 rounded flex items-center gap-0.5">
                                <Video className="h-2.5 w-2.5" /> {videoCount}
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg truncate">
                            {activity.title}
                        </h3>
                        {activity.isPublished ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Published</span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">Draft</span>
                        )}
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        {format(new Date(activity.date), "MMM dd, yyyy")}
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                        {activity.description}
                    </p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => onToggleStatus(activity.id, activity.isPublished)}
                        className={`p-2 rounded-lg transition-colors ${activity.isPublished
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                        title={activity.isPublished ? "Unpublish Activity" : "Publish Activity"}
                    >
                        {activity.isPublished ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={() => onDelete(activity.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Activity"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

