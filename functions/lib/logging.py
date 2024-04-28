import logging


class Logger():
  def __init__(self, logger_name):
    self.logger = logging.getLogger(logger_name)
    self.tags = {}

  def add_tag(self, key, value):
    self.tags[key] = value

  def add_tags(self, tags):
    self.tags = self.tags | tags

  def remove_tag(self, key):
    self.tags.pop(key)

  def remove_all_tag(self):
    self.tags.clear()
  
  def debug(self, message, tags={}) : 
    self.logger.debug(message, extra={"labels": tags | self.tags})

  def info(self, message, tags={}):
    self.logger.info(message, extra={"labels": tags | self.tags})
  
  def warning(self, message, tags={}):
    self.logger.warning(message, extra={"labels": tags | self.tags})
  
  def error(self, message, tags={}):
    self.logger.error(message, extra={"labels": tags | self.tags})

