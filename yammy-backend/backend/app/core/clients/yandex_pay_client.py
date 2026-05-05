import uuid
from aiohttp import ClientSession

from app.infrastructure.config.config import YANDEX_PAY_CONFIG
from app.infrastructure.errors.base import BadRequestException
from app.infrastructure.logging.logger import get_logger
from app.core.dto.yandex_pay import Cart


logger = get_logger(__name__)


class YandexPayClient:
    async def create_order(
        self, 
        order_id: uuid.UUID, 
        cart: Cart,
        customer_phone: str,
        customer_email: str
    ) -> dict:
        for i in range(YANDEX_PAY_CONFIG.MAX_RETRIES):
            logger.info("create order request", order_id=str(order_id), retry_number=i)
            headers = {
                "X-Request-ID": str(uuid.uuid4()),
                "X-Request-Timeout": str(YANDEX_PAY_CONFIG.REQUEST_TIMEOUT),
                "X-Request-Attempt": str(i),
                "Authorization": f"Api-Key {YANDEX_PAY_CONFIG.API_KEY}"
            }
            data = {
                "currencyCode": "RUB",
                "orderId": str(order_id),
                "cart": cart.model_dump(mode='json', by_alias=True),
                "availablePaymentMethods": ["CARD", "SPLIT"],
                "billingPhone": customer_phone,
                "fiscalContact": customer_email,
                "redirectUrls": {
                    "onError": YANDEX_PAY_CONFIG.ON_ERROR_REDIRECT_URL,
                    "onSuccess": YANDEX_PAY_CONFIG.ON_SUCCESS_REDIRECT_URL,
                    "onAbort": YANDEX_PAY_CONFIG.ON_ABORT_REDIRECT_URL,
                }
            }
            logger.info(f"Request yandex client data: {headers} {data}")
            try:
                async with ClientSession() as session:
                    async with session.post(
                        f"{YANDEX_PAY_CONFIG.API_URL}/api/merchant/v1/orders", 
                        json=data, 
                        headers=headers
                    ) as response:
                        response_data = await response.json()
                        if response.status != 200:
                            logger.error(f"Failed to create order request: {response.status} {response_data}")
                            if i == YANDEX_PAY_CONFIG.MAX_RETRIES - 1:
                                raise
                            continue
                        return response_data["data"]["paymentUrl"]
            except Exception as e:
                logger.error(f"Failed to create order exception: {e}")
                return BadRequestException(f"Не удалось создать заказ, попробуйте позже")
                
    async def get_jwks(self):
        for i in range(YANDEX_PAY_CONFIG.MAX_RETRIES):
            try:
                async with ClientSession() as session:
                    async with session.get(f"{YANDEX_PAY_CONFIG.API_URL}/api/jwks") as response:
                        response_data = await response.json()
                        if response.status != 200:
                            logger.error(f"Failed to get jwks: {response.status} {response_data}")
                            continue
                        return response_data
            except Exception as e:
                if i == YANDEX_PAY_CONFIG.MAX_RETRIES - 1:
                    logger.error(f"Failed to get jwks exception: {e}")
                    raise BadRequestException(f"Не удалось получить jwks, попробуйте позже")