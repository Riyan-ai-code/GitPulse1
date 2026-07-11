import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Configured for Supabase Cloud Database storage

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create Supabase client only if credentials are provided, fallback gracefully to log warnings
const isSupabaseConfigured = supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' && supabaseKey && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isSupabaseConfigured) {
  console.warn('[Supabase] Warning: SUPABASE_URL and SUPABASE_KEY are not configured. Database features will be disabled or fallback.');
}

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * 1. getCache(key)
 * Retrieves a cached item and deletes it if expired.
 */
export const getCache = async (key) => {
  try {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('cache')
      .select('data, expires_at')
      .eq('key', key)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No row found
        return null;
      }
      console.error('[SupabaseCache] getCache error:', error);
      return null;
    }
    
    // Check if expired
    const isExpired = new Date() > new Date(data.expires_at);
    if (isExpired) {
      // Async delete so we don't block the retrieve flow
      supabase.from('cache').delete().eq('key', key).then();
      return null;
    }
    
    return data.data;
  } catch (err) {
    console.error('[SupabaseCache] Exception in getCache:', err);
    return null;
  }
};

/**
 * 2. setCache(key, data, durationMs)
 * Upserts cache items. Cleans up expired caches asynchronously.
 */
export const setCache = async (key, data, durationMs = 3600000) => {
  try {
    if (!supabase) return;
    
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    
    // Upsert key
    const { error } = await supabase
      .from('cache')
      .upsert({
        key,
        data,
        expires_at: expiresAt
      });
      
    if (error) {
      console.error('[SupabaseCache] setCache error:', error);
    }
    
    // Asynchronously delete expired cache rows to keep database clean
    const nowISO = new Date().toISOString();
    supabase.from('cache').delete().lt('expires_at', nowISO).then();
  } catch (err) {
    console.error('[SupabaseCache] Exception in setCache:', err);
  }
};

/**
 * 3. logAudit(owner, repo, score, stars, forks, language, version)
 * Upserts a repository analysis log to history list.
 */
export const logAudit = async (owner, repo, score, stars, forks, language, version) => {
  try {
    if (!supabase) return;
    
    const ownerKey = owner.toLowerCase();
    const repoKey = repo.toLowerCase();
    
    const { error } = await supabase
      .from('history')
      .upsert({
        owner: ownerKey,
        repo: repoKey,
        score,
        stars,
        forks,
        primary_language: language || 'Unknown',
        version: version || null,
        analyzed_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('[SupabaseHistory] logAudit error:', error);
    }
  } catch (err) {
    console.error('[SupabaseHistory] Exception in logAudit:', err);
  }
};

/**
 * 4. getHistory()
 * Returns the last 30 audit history entries ordered by analyzed_at desc.
 */
export const getHistory = async () => {
  try {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(30);
      
    if (error) {
      console.error('[SupabaseHistory] getHistory error:', error);
      return [];
    }
    
    // Map fields back to frontend camelCase expectations
    return data.map(item => ({
      owner: item.owner,
      repo: item.repo,
      score: item.score,
      stars: item.stars,
      forks: item.forks,
      primaryLanguage: item.primary_language,
      version: item.version,
      analyzedAt: item.analyzed_at
    }));
  } catch (err) {
    console.error('[SupabaseHistory] Exception in getHistory:', err);
    return [];
  }
};

/**
 * 5. deleteHistoryEntry(owner, repo)
 * Deletes specific repository audit entry.
 */
export const deleteHistoryEntry = async (owner, repo) => {
  try {
    if (!supabase) return false;
    
    const ownerKey = owner.toLowerCase();
    const repoKey = repo.toLowerCase();
    
    const { error, status } = await supabase
      .from('history')
      .delete()
      .eq('owner', ownerKey)
      .eq('repo', repoKey);
      
    if (error) {
      console.error('[SupabaseHistory] deleteHistoryEntry error:', error);
      return false;
    }
    
    return status >= 200 && status < 300;
  } catch (err) {
    console.error('[SupabaseHistory] Exception in deleteHistoryEntry:', err);
    return false;
  }
};

/**
 * 6. deleteCacheEntries(owner, repo)
 * Deletes cache records for a specific repository.
 */
export const deleteCacheEntries = async (owner, repo) => {
  try {
    if (!supabase) return false;
    
    const suffix = `%${owner.toLowerCase()}/${repo.toLowerCase()}`;
    
    const { error, status } = await supabase
      .from('cache')
      .delete()
      .like('key', suffix);
      
    if (error) {
      console.error('[SupabaseCache] deleteCacheEntries error:', error);
      return false;
    }
    
    return status >= 200 && status < 300;
  } catch (err) {
    console.error('[SupabaseCache] Exception in deleteCacheEntries:', err);
    return false;
  }
};
