from enum import Enum


class AdminRoleEnum(str, Enum):
    ADMIN = "admin"
    SUPPORT = "support"


class SupportRequestTypeEnum(str, Enum):
    SUGGESTION = "suggestion"
    PROBLEM = "problem"
    BUG = "bug"


class SupportConversationStatusEnum(str, Enum):
    OPEN = "open"
    CLOSED = "closed"


class SupportMessageDirectionEnum(str, Enum):
    USER = "user"
    STAFF = "staff"


class SupportAttachmentTypeEnum(str, Enum):
    PHOTO = "photo"
    DOCUMENT = "document"


class ProfileModerationStatusEnum(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"


class ReportStatusEnum(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class UserLanguageEnum(str, Enum):
    RU = "ru"
    EN = "en"


class GenderEnum(str,Enum):
    MALE = "male"
    FEMALE = "female"


class SubscriptionTierEnum(str,Enum):
    FREE = "free"
    VIP = "vip"
    PREMIUM = "premium"


class EducationLevelEnum(str,Enum):
    SCHOOL = "school"
    COLLEGE = "college"
    HIGHER = "higher"     


class ChatEvents(str, Enum):
    ERROR = "error"
    OPEN_CHAT = "open_chat"
    MESSAGES = "messages"
    MESSAGE = "message"
    READ = "read"
    DELETE = "delete"
    EDIT = "edit"
    TYPING = "typing"


class PresenceEvents(str, Enum):
    ERROR = "error"
    HEARTBEAT = "heartbeat"
    SUBSCRIBE_PEERS = "subscribe_peers"
    PRESENCE_SNAPSHOT = "presence_snapshot"
    PRESENCE_UPDATE = "presence_update"


class LikeTypeEnum(str, Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    SUPERLIKE = "superlike"


class ReportReasonEnum(str, Enum):
    SPAM = "spam"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    HARASSMENT = "harassment"
    FAKE_PROFILE = "fake_profile"
    OTHER = "other"


class RelationshipGoalEnum(str, Enum):
    DATING = "dating"
    FRIENDSHIP = "friendship"
    COMMUNICATION = "communication"
    RELATIONSHIP = "relationship"
    FWB = "fwb"
    ONS = "ons"
    PARTY = "party"


class JobSphereEnum(str, Enum):
    IT = "it"
    
    DESIGN = "design"
    FASHION = "fashion"
    MEDIA = "media"
    
    FINANCE = "finance"
    MANAGEMENT = "management"
    BUSINESS = "business"
    
    MEDICINE = "medicine"
    EDUCATION = "education"
    LAW = "law"
    GOVERNMENT = "government"
    
    SALES = "sales"
    MARKETING = "marketing"
    BEAUTY = "beauty"
    SERVICE = "service"                 
    
    CONSTRUCTION = "construction"
    ENGINEERING = "engineering"
    LOGISTICS = "logistics"
    
    SPORT = "sport"
    GAMING = "gaming"
    
    AGRICULTURE = "agriculture"
    OTHER = "other"


class AiSearchHistoryStatusEnum(str, Enum):
    SEARCHING = "searching"
    READY = "ready"
    FAILED = "failed"