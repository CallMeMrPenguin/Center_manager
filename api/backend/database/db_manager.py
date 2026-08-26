"""
Center Manager App — Database Manager Master Facade
Modular architecture (<500 lines per module):
  - database.connection
  - database.utils
  - database.schema
  - database.crud_questions_vocab
  - database.crud_documents
  - database.crud_students_teachers
  - database.crud_classes_sessions
  - database.crud_scores_attendance
  - database.crud_relationships
  - database.analytics_predictions
  - database.analytics_engine
  - database.analytics_reports
"""

# Connection & Path
from database.connection import DB_PATH, get_connection

# Utilities
from database.utils import trunc_1_dec, clean_num, get_grade_weights, _get_grade_weights

# Schema & Init
from database.schema import init_db

# Question Bank & Vocabulary
from database.crud_questions_vocab import (
    insert_questions,
    get_questions,
    delete_questions,
    clear_questions,
    increment_question_frequency,
    reset_question_frequency,
    insert_vocabulary,
    get_vocabulary,
    delete_vocabulary,
    clear_vocabulary,
    update_vocabulary,
    update_question,
    get_active_grades,
)

# Documents & Folders
from database.crud_documents import (
    insert_folder,
    get_folders,
    delete_folder,
    insert_document,
    get_documents,
    get_document,
    delete_document,
    restore_document,
    restore_folder,
    permanently_delete_document,
    permanently_delete_folder_recursive,
    purge_old_trash,
    update_document_tags,
    update_document_folder,
    insert_attachment,
    get_attachments,
    get_attachment,
    delete_attachment,
    update_folder_parent,
)

# Students & Teachers
from database.crud_students_teachers import (
    get_students,
    create_student,
    update_student,
    delete_student,
    get_teachers_cm,
    create_teacher_cm,
    update_teacher_cm,
    delete_teacher_cm,
)

# Classes, Sessions & Seating
from database.crud_classes_sessions import (
    get_classes,
    create_class,
    update_class,
    delete_class,
    get_class_students,
    enroll_student_to_class,
    unenroll_student_from_class,
    update_class_student_groups,
    get_class_weekly_schedule,
    add_class_weekly_slot,
    delete_class_weekly_slot,
    get_class_sessions,
    add_class_session,
    update_class_session,
    delete_class_session,
    get_class_seating,
    save_class_seating,
)

# Courses, Scores & Attendance
from database.crud_scores_attendance import (
    get_courses,
    create_course,
    update_course,
    delete_course,
    get_student_scores,
    upsert_student_score,
    delete_student_score,
    get_class_attendance_grades,
    upsert_class_attendance_grades,
)

# Seating Relationships (Friend Groups, Conflict Groups, Trusted Swaps)
from database.crud_relationships import (
    get_friend_groups,
    create_friend_group,
    delete_friend_group,
    add_member_to_group,
    remove_member_from_group,
    get_student_group,
    get_conflict_pairs,
    add_conflict_pair,
    remove_conflict_pair,
    get_trusted_swap_pairs,
    add_trusted_swap_pair,
    remove_trusted_swap_pair,
    get_conflict_groups,
    create_conflict_group,
    delete_conflict_group,
    add_member_to_conflict_group,
    remove_member_from_conflict_group,
    get_trusted_swap_students,
    add_trusted_swap_student,
    remove_trusted_swap_student,
)

# Assignments & Submissions
from database.crud_assignments import (
    get_assignments,
    get_assignment,
    create_assignment,
    update_assignment,
    delete_assignment,
    get_assignment_submissions,
    batch_update_submissions,
    save_student_progress,
)

# Users & Role Permissions
from database.crud_users import (
    get_users,
    create_user,
    update_user,
    delete_user,
    get_role_permissions,
    save_role_permissions,
)

# App Settings & Grade Weights
from database.crud_settings import (
    get_db_setting,
    save_db_setting,
    get_db_grade_weights,
    clear_settings_cache,
)

# Analytics & Predictions
from database.analytics_predictions import (
    _ema_predict,
    _weighted_ols_predict,
    _holtwinters_predict,
    smart_predict,
    get_class_student_predictions,
)
from database.analytics_engine import calculate_performance_analytics
from database.analytics_reports import (
    get_analytics_reports,
    reset_student_grades,
    get_custom_time_phases,
    save_custom_time_phase,
    delete_custom_time_phase,
)

__all__ = [
    "DB_PATH",
    "get_connection",
    "init_db",
    "trunc_1_dec",
    "clean_num",
    "get_grade_weights",
    "_get_grade_weights",
    # Question & Vocab
    "insert_questions",
    "get_questions",
    "delete_questions",
    "clear_questions",
    "increment_question_frequency",
    "reset_question_frequency",
    "insert_vocabulary",
    "get_vocabulary",
    "delete_vocabulary",
    "clear_vocabulary",
    "update_vocabulary",
    "update_question",
    "get_active_grades",
    # Documents
    "insert_folder",
    "get_folders",
    "delete_folder",
    "insert_document",
    "get_documents",
    "get_document",
    "delete_document",
    "restore_document",
    "restore_folder",
    "permanently_delete_document",
    "permanently_delete_folder_recursive",
    "purge_old_trash",
    "update_document_tags",
    "update_document_folder",
    "insert_attachment",
    "get_attachments",
    "get_attachment",
    "delete_attachment",
    "update_folder_parent",
    # Students & Teachers
    "get_students",
    "create_student",
    "update_student",
    "delete_student",
    "get_teachers_cm",
    "create_teacher_cm",
    "update_teacher_cm",
    "delete_teacher_cm",
    # Classes & Sessions
    "get_classes",
    "create_class",
    "update_class",
    "delete_class",
    "get_class_students",
    "enroll_student_to_class",
    "unenroll_student_from_class",
    "update_class_student_groups",
    "get_class_weekly_schedule",
    "add_class_weekly_slot",
    "delete_class_weekly_slot",
    "get_class_sessions",
    "add_class_session",
    "update_class_session",
    "delete_class_session",
    "get_class_seating",
    "save_class_seating",
    # Courses, Scores & Attendance
    "get_courses",
    "create_course",
    "update_course",
    "delete_course",
    "get_student_scores",
    "upsert_student_score",
    "delete_student_score",
    "get_class_attendance_grades",
    "upsert_class_attendance_grades",
    # Relationships
    "get_friend_groups",
    "create_friend_group",
    "delete_friend_group",
    "add_member_to_group",
    "remove_member_from_group",
    "get_student_group",
    "get_conflict_pairs",
    "add_conflict_pair",
    "remove_conflict_pair",
    "get_trusted_swap_pairs",
    "add_trusted_swap_pair",
    "remove_trusted_swap_pair",
    "get_conflict_groups",
    "create_conflict_group",
    "delete_conflict_group",
    "add_member_to_conflict_group",
    "remove_member_from_conflict_group",
    "get_trusted_swap_students",
    "add_trusted_swap_student",
    "remove_trusted_swap_student",
    # Assignments & Submissions
    "get_assignments",
    "get_assignment",
    "create_assignment",
    "update_assignment",
    "delete_assignment",
    "get_assignment_submissions",
    "batch_update_submissions",
    "save_student_progress",
    # Users & Permissions
    "get_users",
    "create_user",
    "update_user",
    "delete_user",
    "get_role_permissions",
    "save_role_permissions",
    # Analytics
    "_ema_predict",
    "_weighted_ols_predict",
    "_holtwinters_predict",
    "smart_predict",
    "calculate_performance_analytics",
    "get_class_student_predictions",
    "get_analytics_reports",
    "reset_student_grades",
    "get_custom_time_phases",
    "save_custom_time_phase",
    "delete_custom_time_phase",
]
