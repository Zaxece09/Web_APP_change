from flask import Flask, render_template, send_from_directory, request, jsonify
from sqlalchemy.exc import IntegrityError
import os
import io
import traceback
import logging
import random
import string
from PIL import Image
from models import UserProfile, Trade, PromoCode, PromoCodeUsage
from database import get_db, create_tables
from config import config

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

@app.route('/img/<path:filename>')
def img_files(filename):
    return send_from_directory('img', filename)

@app.route('/fonts/<path:filename>')
def font_files(filename):
    return send_from_directory('fonts', filename)

@app.route('/icons/<path:filename>')
def icon_files(filename):
    return send_from_directory('icons', filename)

@app.route('/')
def index():
    return send_from_directory('.', 'start.html')

@app.route('/html/<path:filename>')
def html_files(filename):
    return send_from_directory('html', filename)

def generate_referral_code():
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(8))

@app.route('/api/user/init', methods=['POST'])
def init_user():
    try:
        data = request.get_json()
        logger.info(f"Received init_user request: {data}")
        
        if not data or 'userid' not in data:
            logger.error("userid is required but not provided")
            return jsonify({'success': False, 'error': 'userid is required'}), 400
        
        userid = int(data['userid'])
        username = data.get('username')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        referrer_code = data.get('referrer_code')
        
        logger.info(f"Initializing user {userid} with username={username}, first_name={first_name}")
        
        db = next(get_db())
        try:
            user = db.query(UserProfile).filter(UserProfile.userid == userid).first()
            logger.info(f"User {userid} exists: {user is not None}")
            
            if user:
                user.username = username
                user.first_name = first_name
                user.last_name = last_name
                
                user_data = user.to_dict()
                
                db.commit()
                logger.info(f"Updated existing user {userid}")
                
                return jsonify({
                    'success': True,
                    'is_new_user': False,
                    'user': user_data,
                    'referred_by_user': None
                })
            else:
                logger.info(f"Creating new user {userid}")
                referrer_user = None
                if referrer_code:
                    logger.info(f"Looking for referrer with code: {referrer_code}")
                    referrer_user = db.query(UserProfile).filter(UserProfile.referral_code == referrer_code).first()
                    if referrer_user:
                        logger.info(f"Found referrer: {referrer_user.userid}")
                    else:
                        logger.info(f"Referrer not found for code: {referrer_code}")
                
                referral_code = generate_referral_code()
                attempts = 0
                while db.query(UserProfile).filter(UserProfile.referral_code == referral_code).first() and attempts < 10:
                    referral_code = generate_referral_code()
                    attempts += 1
                
                if attempts >= 10:
                    logger.error("Failed to generate unique referral code")
                    return jsonify({'success': False, 'error': 'Failed to generate unique referral code'}), 500
                
                logger.info(f"Generated referral code: {referral_code}")
                
                user = UserProfile(
                    userid=userid,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    referral_code=referral_code,
                    referred_by_userid=referrer_user.userid if referrer_user else None,
                    is_profile_completed=False
                )
                
                db.add(user)
                db.flush()
                logger.info(f"Added new user {userid} to database")
                
                if referrer_user:
                    referrer_user.referral_count += 1
                    logger.info(f"Updated referral count for user {referrer_user.userid}")
                
                user_data = user.to_dict()
                referrer_data = referrer_user.to_dict() if referrer_user else None
                
                db.commit()
                logger.info(f"Successfully created new user {userid}")
                
                return jsonify({
                    'success': True,
                    'is_new_user': True,
                    'user': user_data,
                    'referred_by_user': referrer_data
                })
        
        except Exception as e:
            db.rollback()
            logger.error(f"Database error for user {userid}: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return jsonify({'success': False, 'error': f'Database error: {str(e)}'}), 500
        finally:
            db.close()
    
    except Exception as e:
        logger.error(f"Unexpected error in init_user: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

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
    
    required_fields = ['userid', 'name', 'phone', 'email']
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
            profile.is_profile_completed = True
            logger.info(f"Updating existing profile for userid {data['userid']}")
        else:
            return jsonify({'error': 'User not found. Please initialize user first.'}), 404
        
        db.commit()
        logger.info(f"Profile saved successfully for userid {data['userid']}")
        return jsonify({'success': True, 'message': 'Profile saved successfully', 'data': profile.to_dict()})
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError for userid {data.get('userid')}: {str(e)}")
        return jsonify({'error': 'Profile with this userid already exists'}), 409
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error for userid {data.get('userid')}: {str(e)}")
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

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        total_users = db.query(UserProfile).count()
        total_trades = db.query(Trade).count()
        
        from sqlalchemy import func
        total_exchanged = db.query(func.sum(Trade.amount_usdt)).filter(Trade.status == 'Успех').scalar() or 0
        
        pending_trades = db.query(Trade).filter(Trade.status == 'Ожидание').count()
        success_trades = db.query(Trade).filter(Trade.status == 'Успех').count()
        
        return jsonify({
            'success': True,
            'data': {
                'total_users': total_users,
                'total_projects': total_trades,
                'total_trades': total_trades,
                'total_exchanged': float(total_exchanged),
                'pending_trades': pending_trades,
                'success_trades': success_trades
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting admin dashboard: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        users = db.query(UserProfile).order_by(UserProfile.created_at.desc()).all()
        
        users_data = []
        for user in users:
            user_dict = user.to_dict()
            user_trades = db.query(Trade).filter(Trade.userid == user.userid).count()
            user_dict['trades_count'] = user_trades
            users_data.append(user_dict)
        
        return jsonify({
            'success': True,
            'data': users_data
        })
    
    except Exception as e:
        logger.error(f"Error getting users list: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/admins', methods=['GET'])
def admin_get_admins():
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        admins = db.query(UserProfile).filter(UserProfile.is_admin == 1).order_by(UserProfile.created_at.desc()).all()
        
        admins_data = []
        for admin in admins:
            admin_dict = admin.to_dict()
            admin_dict.pop('passport_photo', None)
            admins_data.append(admin_dict)
        
        return jsonify({
            'success': True,
            'data': admins_data
        })
    
    except Exception as e:
        logger.error(f"Error getting admins list: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/user/<int:user_id>', methods=['PUT'])
def admin_update_user(user_id):
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        user_profile = db.query(UserProfile).filter(UserProfile.userid == user_id).first()
        if not user_profile:
            return jsonify({'error': 'User not found'}), 404
        
        if 'name' in data:
            user_profile.name = data['name']
        if 'is_admin' in data:
            user_profile.is_admin = 1 if data['is_admin'] else 0
        
        db.commit()
        
        logger.info(f"Admin {admin_userid} updated user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'data': user_profile.to_dict()
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/user/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        if user_id == int(admin_userid):
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user_profile = db.query(UserProfile).filter(UserProfile.userid == user_id).first()
        if not user_profile:
            return jsonify({'error': 'User not found'}), 404
        
        user_trades = db.query(Trade).filter(Trade.userid == user_id).all()
        for trade in user_trades:
            db.delete(trade)
        
        db.delete(user_profile)
        db.commit()
        
        logger.info(f"Admin {admin_userid} deleted user {user_id} and {len(user_trades)} trades")
        
        return jsonify({
            'success': True,
            'message': f'User deleted successfully (including {len(user_trades)} trades)'
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/trades', methods=['GET'])
def admin_get_trades():
    admin_userid = request.args.get('userid')
    limit = request.args.get('limit', type=int)
    
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        query = db.query(Trade).order_by(Trade.created_at.desc())
        
        if limit:
            trades = query.limit(limit).all()
        else:
            trades = query.all()
        
        trades_data = []
        for trade in trades:
            trade_dict = trade.to_dict()
            if trade.user:
                trade_dict['user_name'] = trade.user.name
                trade_dict['user_email'] = trade.user.email
                trade_dict['user_phone'] = trade.user.phone
            else:
                trade_dict['user_name'] = f'User {trade.userid}'
                trade_dict['user_email'] = 'N/A'
                trade_dict['user_phone'] = 'N/A'
            trades_data.append(trade_dict)
        
        return jsonify({
            'success': True,
            'data': trades_data
        })
    
    except Exception as e:
        logger.error(f"Error getting trades for admin: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/trade/<trade_id>/status', methods=['PUT'])
def admin_update_trade_status(trade_id):
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({'error': 'status is required'}), 400
    
    new_status = data['status']
    allowed_statuses = ['Ожидание', 'Успех', 'Отмена']
    if new_status not in allowed_statuses:
        return jsonify({'error': f'Invalid status. Allowed: {allowed_statuses}'}), 400
    
    db = next(get_db())
    try:
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        trade = db.query(Trade).filter(Trade.trade_id == trade_id).first()
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        old_status = trade.status
        trade.status = new_status
        
        db.commit()
        
        logger.info(f"Admin {admin_userid} updated trade {trade_id} status from {old_status} to {new_status}")
        
        return jsonify({
            'success': True,
            'message': f'Trade status updated from {old_status} to {new_status}',
            'data': trade.to_dict()
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating trade status: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/trades-stats', methods=['GET'])
def admin_get_trades_stats():
    """Получение статистики по сделкам для диаграммы админа"""
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        # Проверяем является ли пользователь админом
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        # Проверяем общее количество заявок и их статусы
        all_trades = db.query(Trade).all()
        all_statuses = [trade.status for trade in all_trades]
        status_counts = {}
        for status in all_statuses:
            status_counts[status] = status_counts.get(status, 0) + 1
        
        logger.info(f"All trades count: {len(all_trades)}")
        logger.info(f"Status distribution: {status_counts}")
        
        # Получаем статистику по статусам (только завершенные и отмененные)
        completed_trades = db.query(Trade).filter(Trade.status == 'Успех').all()
        cancelled_trades = db.query(Trade).filter(Trade.status == 'Отмена').all()
        
        completed_count = len(completed_trades)
        cancelled_count = len(cancelled_trades)
        total_count = completed_count + cancelled_count
        
        logger.info(f"Trades stats: completed={completed_count}, cancelled={cancelled_count}, total={total_count}")
        
        # Формируем детализированные данные
        detailed_trades = []
        
        # Добавляем завершенные сделки
        for trade in completed_trades:
            user_name = trade.user.name if trade.user and trade.user.name else f'User {trade.userid}'
            detailed_trades.append({
                'id': trade.trade_id,
                'user': user_name,
                'status': 'Завершен',
                'amount_usdt': trade.amount_usdt,
                'amount_rub': trade.amount_rub,
                'created_at': trade.created_at.strftime('%d.%m.%Y %H:%M') if trade.created_at else 'N/A'
            })
        
        # Добавляем отмененные сделки
        for trade in cancelled_trades:
            user_name = trade.user.name if trade.user and trade.user.name else f'User {trade.userid}'
            detailed_trades.append({
                'id': trade.trade_id,
                'user': user_name,
                'status': 'Отменен',
                'amount_usdt': trade.amount_usdt,
                'amount_rub': trade.amount_rub,
                'created_at': trade.created_at.strftime('%d.%m.%Y %H:%M') if trade.created_at else 'N/A'
            })
        
        # Сортируем по дате создания (новые сначала)
        detailed_trades.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'total_count': total_count,
                'completed_count': completed_count,
                'cancelled_count': cancelled_count,
                'detailed_trades': detailed_trades,
                'debug_info': {
                    'all_trades_count': len(all_trades),
                    'status_distribution': status_counts
                }
            }
        })
    
    except Exception as e:
        logger.error(f"Error getting trades statistics: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# ================================
# PROMOCODES API ENDPOINTS
# ================================

@app.route('/api/admin/promocodes', methods=['GET'])
def admin_get_promocodes():
    """Получение всех промокодов для админа"""
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        # Проверяем является ли пользователь админом
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        promocodes = db.query(PromoCode).order_by(PromoCode.created_at.desc()).all()
        
        promocodes_data = []
        for promo in promocodes:
            promo_dict = promo.to_dict()
            # Добавляем статистику использования
            usages = db.query(PromoCodeUsage).filter(PromoCodeUsage.promocode_id == promo.id).all()
            promo_dict['usage_count'] = len(usages)
            promo_dict['usage_details'] = [usage.to_dict() for usage in usages]
            promocodes_data.append(promo_dict)
        
        return jsonify({
            'success': True,
            'data': promocodes_data
        })
    
    except Exception as e:
        logger.error(f"Error getting promocodes for admin: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/promocodes', methods=['POST'])
def admin_create_promocode():
    """Создание нового промокода"""
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    data = request.get_json()
    required_fields = ['name', 'code', 'discount_value', 'max_uses']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    
    db = next(get_db())
    try:
        # Проверяем является ли пользователь админом
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        # Проверяем уникальность кода
        existing_promo = db.query(PromoCode).filter(PromoCode.code == data['code']).first()
        if existing_promo:
            return jsonify({'error': 'Promo code already exists'}), 409
        
        # Парсим даты если они переданы
        start_date = None
        end_date = None
        if data.get('start_date'):
            from datetime import datetime
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if data.get('end_date'):
            from datetime import datetime
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
        promocode = PromoCode(
            name=data['name'],
            code=data['code'].upper(),  # Приводим к верхнему регистру
            discount_type=data.get('discount_type', 'percentage'),
            discount_value=float(data['discount_value']),
            max_uses=int(data['max_uses']),
            start_date=start_date,
            end_date=end_date,
            is_active=data.get('is_active', True),
            created_by=int(admin_userid)
        )
        
        db.add(promocode)
        db.commit()
        
        logger.info(f"Admin {admin_userid} created promocode {data['code']}")
        
        return jsonify({
            'success': True,
            'message': 'Promocode created successfully',
            'data': promocode.to_dict()
        })
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError creating promocode: {str(e)}")
        return jsonify({'error': 'Promo code already exists'}), 409
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating promocode: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/promocodes/<int:promo_id>', methods=['PUT'])
def admin_update_promocode(promo_id):
    """Обновление промокода"""
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data is required'}), 400
    
    db = next(get_db())
    try:
        # Проверяем является ли пользователь админом
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        promocode = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
        if not promocode:
            return jsonify({'error': 'Promocode not found'}), 404
        
        # Проверяем уникальность кода, если он изменился
        if 'code' in data and data['code'] != promocode.code:
            existing_promo = db.query(PromoCode).filter(PromoCode.code == data['code']).first()
            if existing_promo:
                return jsonify({'error': 'Promo code already exists'}), 409
        
        # Обновляем поля
        if 'name' in data:
            promocode.name = data['name']
        if 'code' in data:
            promocode.code = data['code'].upper()
        if 'discount_type' in data:
            promocode.discount_type = data['discount_type']
        if 'discount_value' in data:
            promocode.discount_value = float(data['discount_value'])
        if 'max_uses' in data:
            promocode.max_uses = int(data['max_uses'])
        if 'is_active' in data:
            promocode.is_active = data['is_active']
        
        # Обновляем даты если переданы
        if 'start_date' in data:
            if data['start_date']:
                from datetime import datetime
                promocode.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            else:
                promocode.start_date = None
                
        if 'end_date' in data:
            if data['end_date']:
                from datetime import datetime
                promocode.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            else:
                promocode.end_date = None
        
        db.commit()
        
        logger.info(f"Admin {admin_userid} updated promocode {promo_id}")
        
        return jsonify({
            'success': True,
            'message': 'Promocode updated successfully',
            'data': promocode.to_dict()
        })
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError updating promocode: {str(e)}")
        return jsonify({'error': 'Promo code already exists'}), 409
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating promocode: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/admin/promocodes/<int:promo_id>', methods=['DELETE'])
def admin_delete_promocode(promo_id):
    """Удаление промокода"""
    admin_userid = request.args.get('userid')
    if not admin_userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        # Проверяем является ли пользователь админом
        admin_profile = db.query(UserProfile).filter(UserProfile.userid == int(admin_userid)).first()
        if not admin_profile or admin_profile.is_admin != 1:
            return jsonify({'error': 'Access denied. Admin privileges required'}), 403
        
        promocode = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
        if not promocode:
            return jsonify({'error': 'Promocode not found'}), 404
        
        # Удаляем связанные использования
        usages = db.query(PromoCodeUsage).filter(PromoCodeUsage.promocode_id == promo_id).all()
        for usage in usages:
            db.delete(usage)
        
        # Удаляем промокод
        db.delete(promocode)
        db.commit()
        
        logger.info(f"Admin {admin_userid} deleted promocode {promo_id} and {len(usages)} usages")
        
        return jsonify({
            'success': True,
            'message': f'Promocode deleted successfully (including {len(usages)} usages)'
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting promocode {promo_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/promocodes/validate', methods=['POST'])
def validate_promocode():
    """Валидация промокода для использования пользователем"""
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'error': 'Promo code is required'}), 400
    
    userid = data.get('userid')
    if not userid:
        return jsonify({'error': 'userid is required'}), 400
    
    db = next(get_db())
    try:
        promocode = db.query(PromoCode).filter(PromoCode.code == data['code'].upper()).first()
        if not promocode:
            return jsonify({'valid': False, 'message': 'Промокод не найден'}), 404
        
        # Проверяем активность
        if not promocode.is_active:
            return jsonify({'valid': False, 'message': 'Промокод не активен'}), 400
        
        # Проверяем количество использований
        if promocode.current_uses >= promocode.max_uses:
            return jsonify({'valid': False, 'message': 'Промокод исчерпан'}), 400
        
        # Проверяем даты
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        
        if promocode.start_date and now < promocode.start_date:
            return jsonify({'valid': False, 'message': 'Промокод еще не активен'}), 400
            
        if promocode.end_date and now > promocode.end_date:
            return jsonify({'valid': False, 'message': 'Промокод истек'}), 400
        
        # Проверяем, не использовал ли уже этот пользователь данный промокод
        existing_usage = db.query(PromoCodeUsage).filter(
            PromoCodeUsage.promocode_id == promocode.id,
            PromoCodeUsage.userid == int(userid)
        ).first()
        
        if existing_usage:
            return jsonify({'valid': False, 'message': 'Вы уже использовали этот промокод'}), 400
        
        return jsonify({
            'valid': True,
            'promocode': promocode.to_dict(),
            'message': 'Промокод действителен'
        })
    
    except Exception as e:
        logger.error(f"Error validating promocode: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/promocodes/apply', methods=['POST'])
def apply_promocode():
    """Применение промокода к сделке"""
    data = request.get_json()
    required_fields = ['code', 'userid', 'trade_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    db = next(get_db())
    try:
        promocode = db.query(PromoCode).filter(PromoCode.code == data['code'].upper()).first()
        if not promocode:
            return jsonify({'error': 'Promocode not found'}), 404
        
        # Проверяем активность и доступность (аналогично validate)
        if not promocode.is_active:
            return jsonify({'error': 'Promocode is not active'}), 400
        
        if promocode.current_uses >= promocode.max_uses:
            return jsonify({'error': 'Promocode is exhausted'}), 400
        
        # Проверяем даты
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        
        if promocode.start_date and now < promocode.start_date:
            return jsonify({'error': 'Promocode is not yet active'}), 400
            
        if promocode.end_date and now > promocode.end_date:
            return jsonify({'error': 'Promocode has expired'}), 400
        
        # Проверяем, не использовал ли уже этот пользователь данный промокод
        existing_usage = db.query(PromoCodeUsage).filter(
            PromoCodeUsage.promocode_id == promocode.id,
            PromoCodeUsage.userid == int(data['userid'])
        ).first()
        
        if existing_usage:
            return jsonify({'error': 'You have already used this promocode'}), 400
        
        # Создаем запись об использовании
        usage = PromoCodeUsage(
            promocode_id=promocode.id,
            userid=int(data['userid']),
            trade_id=data['trade_id']
        )
        
        # Увеличиваем счетчик использований
        promocode.current_uses += 1
        
        db.add(usage)
        db.commit()
        
        logger.info(f"User {data['userid']} applied promocode {data['code']} to trade {data['trade_id']}")
        
        return jsonify({
            'success': True,
            'message': 'Promocode applied successfully',
            'promocode': promocode.to_dict(),
            'usage': usage.to_dict()
        })
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error applying promocode: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/referral/stats', methods=['GET'])
def get_referral_stats():
    """Получить статистику по рефералам"""
    userid = request.args.get('userid')
    if not userid:
        return jsonify({'error': 'userid parameter is required'}), 400
    
    db = next(get_db())
    try:
        user = db.query(UserProfile).filter(UserProfile.userid == int(userid)).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Получаем список рефералов
        referrals = db.query(UserProfile).filter(UserProfile.referred_by_userid == int(userid)).all()
        
        # Подсчитываем реальное количество рефералов (на случай если поле не обновлялось)
        actual_referral_count = len(referrals)
        
        # Обновляем количество рефералов если оно не совпадает
        if user.referral_count != actual_referral_count:
            user.referral_count = actual_referral_count
            db.commit()
        
        return jsonify({
            'success': True,
            'referral_code': user.referral_code,
            'referral_count': actual_referral_count,
            'referral_earnings': user.referral_earnings or 0
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/config', methods=['GET'])
def get_config():
    """Получить публичную конфигурацию"""
    return jsonify({
        'success': True,
        'bot_username': config.bot_username
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)