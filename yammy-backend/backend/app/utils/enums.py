from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


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
    MESSAGE = "message"
    READ = "read"
    DELETE = "delete"
    EDIT = "edit"


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
    
    ART_DESIGN = "art_design"
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