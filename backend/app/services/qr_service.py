import qrcode
import base64
from io import BytesIO
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class QRService:
    
    def generate_qr_code(self, data: str) -> Tuple[bool, str, str]:
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            logger.info(f"QR code generated for data: {data[:20]}...")
            return True, img_base64, "QR code generated successfully"
            
        except Exception as e:
            logger.error(f"Failed to generate QR code: {e}")
            return False, "", f"Failed to generate QR code: {str(e)}"
    
    def generate_session_qr(self, session_id: int, qr_code: str) -> Tuple[bool, str, str]:
        try:
            qr_data = {
                "session_id": session_id,
                "qr_code": qr_code,
                "type": "attendance_session"
            }
            
            import json
            qr_string = json.dumps(qr_data)
            
            return self.generate_qr_code(qr_string)
            
        except Exception as e:
            logger.error(f"Failed to generate session QR: {e}")
            return False, "", f"Failed to generate session QR: {str(e)}"


qr_service = QRService()