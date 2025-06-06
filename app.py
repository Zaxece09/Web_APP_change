from flask import Flask, render_template, send_from_directory, request, jsonify
from sqlalchemy.exc import IntegrityError
import os
import io
import traceback
import logging
import random
import string
from PIL import Image
from models import UserProfile, Trade
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

def generate_trade_id():
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(8))

@app.route('/api/trade', methods=['POST'])
def create_trade():
    data = request.get_json()
    
    required_fields = ['userid', 'amount', 'date', 'time']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    
    db = next(get_db())
    try:
        profile = db.query(UserProfile).filter(UserProfile.userid == int(data['userid'])).first()
        if not profile:
            return jsonify({'error': 'User profile not found'}), 404
        
        pending_trade = db.query(Trade).filter(
            Trade.userid == int(data['userid']),
            Trade.status == 'Ожидание'
        ).first()
        
        if pending_trade:
            return jsonify({
                'error': f'У вас уже есть активная сделка в ожидании (ID: {pending_trade.trade_id}). Дождитесь её завершения перед созданием новой.'
            }), 409
        
        existing_trade = db.query(Trade).filter(
            Trade.trade_date == data['date'],
            Trade.trade_time == data['time'],
            Trade.status.in_(['Ожидание', 'Успех'])
        ).first()
        
        if existing_trade:
            return jsonify({'error': 'Выбранное время уже занято. Пожалуйста, выберите другое время.'}), 409
        
        trade_id = generate_trade_id()
        while db.query(Trade).filter(Trade.trade_id == trade_id).first():
            trade_id = generate_trade_id()
        
        amount_usdt = float(data['amount'])
        amount_rub = amount_usdt * 95.0
        
        trade = Trade(
            trade_id=trade_id,
            userid=int(data['userid']),
            amount_usdt=amount_usdt,
            amount_rub=amount_rub,
            trade_date=data['date'],
            trade_time=data['time'],
            status='Ожидание',
            usdt_address='TXYZ123abcDEF456ghiJKL789mnoPQR'
        )
        
        db.add(trade)
        db.commit()
        
        logger.info(f"Trade created successfully: {trade_id} for userid {data['userid']}")
        return jsonify({
            'success': True, 
            'message': 'Trade created successfully',
            'data': trade.to_dict()
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating trade: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/trade/<trade_id>/complete', methods=['POST'])
def complete_trade(trade_id):
    data = request.get_json()
    
    if 'transaction_hash' not in data or not data['transaction_hash']:
        return jsonify({'error': 'transaction_hash is required'}), 400
    
    transaction_hash = data['transaction_hash'].strip()
    
    import re
    if not re.match(r'^[a-fA-F0-9]{64}$', transaction_hash):
        return jsonify({'error': 'Invalid transaction hash format'}), 400
    
    db = next(get_db())
    try:
        trade = db.query(Trade).filter(Trade.trade_id == trade_id).first()
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        trade.transaction_hash = transaction_hash
        trade.status = 'Ожидание'
        
        db.commit()
        
        logger.info(f"Trade completed: {trade_id} with transaction hash: {transaction_hash}")
        return jsonify({
            'success': True,
            'message': 'Trade completed successfully',
            'data': trade.to_dict()
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error completing trade {trade_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/trades', methods=['GET'])
def get_trades():
    userid = request.args.get('userid')
    if not userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        trades = db.query(Trade).filter(Trade.userid == int(userid)).order_by(Trade.created_at.desc()).all()
        
        trades_data = []
        for trade in trades:
            trade_dict = trade.to_dict()
            if trade.user:
                trade_dict['user_name'] = trade.user.name
                trade_dict['user_email'] = trade.user.email
                trade_dict['user_address'] = trade.user.address
            trades_data.append(trade_dict)
        
        return jsonify({
            'success': True,
            'data': trades_data
        })
    
    except Exception as e:
        logger.error(f"Error getting trades for userid {userid}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/trade/<trade_id>', methods=['GET'])
def get_trade_details(trade_id):
    db = next(get_db())
    try:
        trade = db.query(Trade).filter(Trade.trade_id == trade_id).first()
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        trade_dict = trade.to_dict()
        if trade.user:
            trade_dict['user_name'] = trade.user.name
            trade_dict['user_email'] = trade.user.email
            trade_dict['user_address'] = trade.user.address
        
        return jsonify({
            'success': True,
            'data': trade_dict
        })
    
    except Exception as e:
        logger.error(f"Error getting trade details {trade_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/occupied-slots', methods=['GET'])
def get_occupied_slots():
    date = request.args.get('date')
    if not date:
        return jsonify({'error': 'date parameter is required'}), 400
    
    db = next(get_db())
    try:
        occupied_trades = db.query(Trade).filter(
            Trade.trade_date == date,
            Trade.status.in_(['Ожидание', 'Успех'])
        ).all()
        
        occupied_slots = [trade.trade_time for trade in occupied_trades]
        
        logger.info(f"Occupied slots for date {date}: {occupied_slots}")
        
        return jsonify({
            'success': True,
            'data': occupied_slots
        })
    
    except Exception as e:
        logger.error(f"Error getting occupied slots for date {date}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/user-status', methods=['GET'])
def get_user_status():
    userid = request.args.get('userid')
    if not userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        pending_trade = db.query(Trade).filter(
            Trade.userid == int(userid),
            Trade.status == 'Ожидание'
        ).first()
        
        return jsonify({
            'success': True,
            'data': {
                'has_pending_trades': pending_trade is not None,
                'pending_trade_id': pending_trade.trade_id if pending_trade else None,
                'can_create_trade': pending_trade is None
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting user status for userid {userid}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)