import { NextRequest, NextResponse } from 'next/server';
import { withAdminAPIAuth } from '@/lib/auth/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

interface UserManagementData {
  users: {
    id: string;
    handle: string;
    email: string;
    role: 'admin' | 'moderator' | 'member';
    xp: number;
    created_at: string;
    last_login: string | null;
    article_count: number;
    total_views: number;
    status: 'active' | 'suspended' | 'banned';
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    roles: string[];
    statuses: string[];
    searchQuery?: string;
  };
}

/**
 * User Management API Endpoint
 * GET /api/admin/management/users
 *
 * Provides user management data with filtering and pagination
 */
async function getUserManagement(
  request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  try {
    console.log('👥 User management data requested by:', context.user.email);
    const supabase = getSupabaseAdmin();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const roleFilter = searchParams.get('role');
    const searchQuery = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    console.log('📊 Query parameters:', {
      page,
      limit,
      roleFilter,
      searchQuery,
      sortBy,
      sortOrder,
    });

    // Build the base query
    let query = supabase.from('users').select(
      `
        id,
        handle,
        role,
        xp,
        created_at,
        articles:articles(count),
        article_views:articles(view_count)
      `,
      { count: 'exact' }
    );

    // Apply role filter
    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    // Apply search filter
    if (searchQuery) {
      query = query.or(`handle.ilike.%${searchQuery}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: usersData, error: usersError, count } = await query;

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(
      `✅ Fetched ${usersData?.length || 0} users out of ${count || 0} total`
    );

    // Get auth data for emails (from auth.users table)
    const _userIds = usersData?.map((u) => u.id) || [];
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Get all users to match with our filtered results
      });

    if (authError) {
      console.warn('⚠️ Failed to fetch auth data:', authError.message);
    }

    // Create a map of user ID to email
    const emailMap = new Map<string, string>();
    authData?.users?.forEach((authUser) => {
      if (authUser.id && authUser.email) {
        emailMap.set(authUser.id, authUser.email);
      }
    });

    // Process user data
    const users = (usersData || []).map((user: any) => ({
      id: String(user.id),
      handle: String(user.handle),
      email: emailMap.get(user.id) || 'N/A',
      role: user.role as 'admin' | 'moderator' | 'member',
      xp: Number(user.xp || 0),
      created_at: String(user.created_at),
      last_login: null as string | null,
      article_count: Number(user.articles?.length || 0),
      total_views: Number(
        user.article_views?.reduce(
          (sum: number, article: any) => sum + (article.view_count || 0),
          0
        ) || 0
      ),
      status: 'active' as 'active' | 'suspended' | 'banned',
    }));

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit);

    const managementData: UserManagementData = {
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
      filters: {
        roles: ['admin', 'moderator', 'member'],
        statuses: ['active', 'suspended', 'banned'],
        searchQuery: searchQuery || undefined,
      },
    };

    console.log('✅ User management data compiled successfully:', {
      userCount: users.length,
      totalUsers: count,
      currentPage: page,
      totalPages,
    });

    return NextResponse.json({
      success: true,
      data: managementData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ User management endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch user management data',
        code: 'USER_MANAGEMENT_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Update User Role/Status
 * PUT /api/admin/management/users
 */
async function updateUser(
  request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  try {
    console.log('👥 User update requested by:', context.user.email);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'Missing userId or updates' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating user:', { userId, updates });

    // Update user in the users table
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    console.log('✅ User updated successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ User update endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update user',
        code: 'USER_UPDATE_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply admin authentication middleware
export const GET = withAdminAPIAuth(getUserManagement);
export const PUT = withAdminAPIAuth(updateUser);

// Not allowed methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET, PUT' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET, PUT' } }
  );
}
