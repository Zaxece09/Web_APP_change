from flask import Flask, render_template, send_from_directory, request, jsonify
from sqlalchemy.exc import IntegrityError
import os
import io
import traceback
import logging
from PIL import Image
from models import UserProfile
from database import get_db, create_tables

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
            static_folder='static',
            template_folder='.')

create_tables()

@app.route('/css/<path:filename>')
def css_files(filename):
    return send_from_directory('css', filename)

@app.route('/javascript/<path:filename>')
def js_files(filename):
    return send_from_directory('javascript', filename)

@app.route('/images/<path:filename>')
def image_files(filename):
    return send_from_directory('images', filename)

@app.route('/fonts/<path:filename>')
def font_files(filename):
    return send_from_directory('fonts', filename)

@app.route('/icons/<path:filename>')
def icon_files(filename):
    return send_from_directory('icons', filename)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/html/<path:filename>')
def html_files(filename):
    return send_from_directory('html', filename)

@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Получение профиля пользователя"""
    userid = request.args.get('userid')
    if not userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        profile = db.query(UserProfile).filter(UserProfile.userid == int(userid)).first()
        if profile:
            return jsonify({'success': True, 'data': profile.to_dict()})
        else:
            return jsonify({'success': False, 'message': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/profile', methods=['POST'])
def save_profile():
    """Сохранение или обновление профиля пользователя"""
    data = request.get_json()
    
    required_fields = ['userid', 'name', 'phone', 'email', 'address']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    
    db = next(get_db())
    try:
        profile = db.query(UserProfile).filter(UserProfile.userid == int(data['userid'])).first()
        
        if profile:
            profile.name = data['name']
            profile.phone = data['phone']
            profile.phone_additional = data.get('phone_additional', '')
            profile.email = data['email']
            profile.address = data['address']
            logger.info(f"Updating existing profile for userid {data['userid']}")
        else:
            profile = UserProfile(
                userid=int(data['userid']),
                name=data['name'],
                phone=data['phone'],
                phone_additional=data.get('phone_additional', ''),
                email=data['email'],
                address=data['address']
            )
            db.add(profile)
            logger.info(f"Creating new profile for userid {data['userid']}")
        
        db.commit()
        logger.info(f"Profile saved successfully for userid {data['userid']}")
        return jsonify({'success': True, 'message': 'Profile saved successfully', 'data': profile.to_dict()})
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError for userid {data.get('userid')}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Profile with this userid already exists'}), 409
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error for userid {data.get('userid')}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/passport', methods=['POST'])
def upload_passport():
    """Загрузка фото паспорта"""
    userid = request.form.get('userid')
    if not userid:
        return jsonify({'error': 'userid is required'}), 400
    
    if 'passport_photo' not in request.files:
        return jsonify({'error': 'No passport photo provided'}), 400
    
    file = request.files['passport_photo']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    allowed_extensions = {'png', 'jpg', 'jpeg'}
    if not (file.filename.lower().endswith(tuple(allowed_extensions))):
        return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG allowed'}), 400
    
    db = next(get_db())
    try:
        profile = db.query(UserProfile).filter(UserProfile.userid == int(userid)).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        image = Image.open(file.stream)

        if image.mode in ['RGBA', 'P', 'LA']:
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_image.paste(image, mask=image.split()[-1] if image.mode in ['RGBA', 'LA'] else None)
            image = rgb_image
        elif image.mode not in ['RGB', 'L']:
            image = image.convert('RGB')
        
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        img_byte_array = io.BytesIO()
        image.save(img_byte_array, format='JPEG', quality=85)
        img_byte_array = img_byte_array.getvalue()
        
        profile.passport_photo = img_byte_array
        db.commit()
        
        logger.info(f"Passport photo uploaded successfully for userid {userid}")
        return jsonify({'success': True, 'message': 'Passport photo uploaded successfully'})
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error uploading passport for userid {userid}: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/passport/<int:userid>', methods=['GET'])
def get_passport(userid):
    """Получение фото паспорта"""
    db = next(get_db())
    try:
        profile = db.query(UserProfile).filter(UserProfile.userid == userid).first()
        if not profile or not profile.passport_photo:
            return jsonify({'error': 'Passport photo not found'}), 404
        
        return app.response_class(
            profile.passport_photo,
            mimetype='image/jpeg',
            headers={"Content-Disposition": "inline; filename=passport.jpg"}
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)